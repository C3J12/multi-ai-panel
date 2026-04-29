require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// 模型配置（目前只配了 DeepSeek，以后加别的在这里加）
const MODEL_CONFIGS = {
  'deepseek': {
    name: 'DeepSeek',
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
    model: 'deepseek-chat',
    color: 'bg-blue-100 border-blue-400'
  },
  'ali-qwen': {
    name: '通义千问',
    apiKey: process.env.ALI_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    color: 'bg-orange-100 border-orange-400'
  }
};

// 设置流式响应头（让前端可以一个字一个字接收）
function setSSEHeaders(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
}

// 核心接口：POST /api/ask
app.post('/api/ask', async (req, res) => {
  const { question, models } = req.body;
  if (!question || !models) {
    return res.status(400).json({ error: '需要 question 和 models 参数' });
  }

  setSSEHeaders(res);
  res.write(`data: ${JSON.stringify({ type: 'start', models })}\n\n`);

  const promises = models.map(async (modelId) => {
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      res.write(`data: ${JSON.stringify({ model: modelId, type: 'error', content: '未知模型' })}\n\n`);
      return;
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    try {
      const stream = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: question }],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ model: modelId, type: 'chunk', content })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ model: modelId, type: 'done' })}\n\n`);
    } catch (err) {
      console.error(`${config.name} 错误:`, err);
      res.write(`data: ${JSON.stringify({ model: modelId, type: 'error', content: err.message })}\n\n`);
    }
  });

  await Promise.all(promises);
  res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
  res.end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ 后端跑起来了 → http://localhost:${PORT}`);
});