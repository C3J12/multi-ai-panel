const express = require('express');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const db = require('../db/connection');

const router = express.Router();

// 模型配置（与前端对应）
const MODEL_CONFIGS = {
  'deepseek': {
    name: 'DeepSeek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  'ali-qwen': {
    name: '通义千问',
    apiKey: process.env.ALI_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
  }
};

/**
 * 设置 SSE 响应头
 */
function setSSEHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
}

/**
 * 构建 OpenAI messages 数组
 * 从数据库获取对话历史，转换为 messages 格式
 * 如果提供了 systemPrompt，则在数组首位插入 system message
 */
function buildMessagesArray(messages, systemPrompt = null) {
  const result = [];
  
  // 如果有系统提示词，放在最前面
  if (systemPrompt && systemPrompt.trim()) {
    result.push({ role: 'system', content: systemPrompt.trim() });
  }
  
  for (const msg of messages) {
    if (msg.role === 'user') {
      result.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      result.push({ role: 'assistant', content: msg.content });
    }
  }
  
  return result;
}

/**
 * POST /api/chat
 * 多轮对话接口（流式 SSE）
 * 请求体: { conversationId, question, selectedModels }
 */
router.post('/', async (req, res) => {
  const { conversationId, question, selectedModels } = req.body;
  
  // 参数验证
  if (!conversationId || !question || !selectedModels || selectedModels.length === 0) {
    return res.status(400).json({ 
      error: '需要提供 conversationId、question 和 selectedModels' 
    });
  }
  
  // 验证对话存在
  const conversation = db.getConversation(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: '对话不存在' });
  }
  
  // 验证模型
  const validModels = selectedModels.filter(m => MODEL_CONFIGS[m]);
  if (validModels.length === 0) {
    return res.status(400).json({ error: '未知的模型' });
  }
  
  setSSEHeaders(res);
  
  try {
    // 1. 保存用户问题到数据库
    const questionMessageId = uuidv4();
    db.addMessage(
      questionMessageId,
      conversationId,
      'user',
      question,
      null
    );
    
    // 2. 获取对话历史消息
    const allMessages = db.getMessages(conversationId);
    
    // 3. 构建 messages 数组（最近 20 条消息以节省 token）
    const recentMessages = allMessages.slice(-40); // 最多 20 轮对话（每轮2条消息）
    const messagesForAI = buildMessagesArray(recentMessages, conversation.systemPrompt);
    
    // 4. 发送流式开始标记
    res.write(`data: ${JSON.stringify({ type: 'start', models: validModels })}\n\n`);
    
    // 5. 为每个模型创建 AI 回答消息 ID（预先创建，后续更新内容）
    const modelMessageIds = {};
    for (const modelId of validModels) {
      const msgId = uuidv4();
      modelMessageIds[modelId] = msgId;
      // 先创建空消息（content 为空），后续逐字更新
      db.addMessage(msgId, conversationId, 'assistant', '', modelId);
    }
    
    // 6. 并发调用各个模型
    const promises = validModels.map(async (modelId) => {
      const config = MODEL_CONFIGS[modelId];
      const messageId = modelMessageIds[modelId];
      let fullContent = '';
      
      try {
        const client = new OpenAI({
          apiKey: config.apiKey,
          baseURL: config.baseURL,
        });
        
        // 调用流式 API
        const stream = await client.chat.completions.create({
          model: config.model,
          messages: messagesForAI,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
        });
        
        // 处理流式响应
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            // 发送 chunk
            res.write(`data: ${JSON.stringify({ 
              model: modelId, 
              type: 'chunk', 
              content 
            })}\n\n`);
            
            // 实时更新数据库消息内容（可选，高频更新）
            // 为了性能，可以每累积 5 个 chunk 更新一次
            if (fullContent.length % 100 < 5) {
              db.updateMessageContent(messageId, fullContent);
            }
          }
        }
        
        // 完整内容保存到数据库
        db.updateMessageContent(messageId, fullContent);
        
        // 发送完成标记
        res.write(`data: ${JSON.stringify({ 
          model: modelId, 
          type: 'done',
          tokensUsed: fullContent.length // 粗略估算
        })}\n\n`);
        
        console.log(`✅ ${config.name} 完成，字数: ${fullContent.length}`);
      } catch (err) {
        console.error(`❌ ${config.name} 错误:`, err.message);
        
        // 发送错误信息
        res.write(`data: ${JSON.stringify({ 
          model: modelId, 
          type: 'error', 
          content: err.message 
        })}\n\n`);
        
        // 更新数据库中的消息为错误信息
        db.updateMessageContent(messageId, `[错误] ${err.message}`);
      }
    });
    
    // 等待所有模型完成
    await Promise.all(promises);
    
    // 7. 发送流式结束标记
    res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
    
    console.log(`✅ 对话完成: ${conversationId}`);
  } catch (err) {
    console.error('聊天接口错误:', err);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      content: err.message 
    })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
