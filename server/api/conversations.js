const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

const router = express.Router();

/**
 * GET /api/conversations
 * 获取所有对话列表（按更新时间倒序）
 */
router.get('/', (req, res) => {
  try {
    const conversations = db.getConversations();
    res.json({ success: true, conversations });
  } catch (err) {
    console.error('获取对话列表出错:', err);
    res.status(500).json({ success: false, error: '获取对话列表失败' });
  }
});

/**
 * GET /api/conversations/:id
 * 获取单个对话详情（包含所有消息）
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const conversation = db.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ success: false, error: '对话不存在' });
    }
    
    const messages = db.getMessages(id);
    res.json({ 
      success: true, 
      conversation,
      messages 
    });
  } catch (err) {
    console.error('获取对话详情出错:', err);
    res.status(500).json({ success: false, error: '获取对话详情失败' });
  }
});

/**
 * POST /api/conversations
 * 创建新对话
 * 请求体: { title?: string }
 */
router.post('/', (req, res) => {
  try {
    const { title } = req.body;
    const id = uuidv4();
    
    const conversation = db.createConversation(id, title || '未命名对话');
    res.status(201).json({ success: true, conversation });
  } catch (err) {
    console.error('创建对话出错:', err);
    res.status(500).json({ success: false, error: '创建对话失败' });
  }
});

/**
 * PUT /api/conversations/:id
 * 更新对话标题
 * 请求体: { title: string }
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ success: false, error: '标题不能为空' });
    }
    
    const conversation = db.getConversation(id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: '对话不存在' });
    }
    
    db.updateConversationTitle(id, title);
    const updated = db.getConversation(id);
    
    res.json({ success: true, conversation: updated });
  } catch (err) {
    console.error('更新对话出错:', err);
    res.status(500).json({ success: false, error: '更新对话失败' });
  }
});

/**
 * DELETE /api/conversations/:id
 * 删除对话（包括所有消息）
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const conversation = db.getConversation(id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: '对话不存在' });
    }
    
    db.deleteConversation(id);
    res.json({ success: true, message: '对话已删除' });
  } catch (err) {
    console.error('删除对话出错:', err);
    res.status(500).json({ success: false, error: '删除对话失败' });
  }
});

/**
 * GET /api/conversations/:id/messages
 * 获取对话的最近 N 条消息
 * 查询参数: limit (默认50)
 */
router.get('/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const conversation = db.getConversation(id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: '对话不存在' });
    }
    
    const messages = db.getRecentMessages(id, parseInt(limit));
    res.json({ success: true, messages });
  } catch (err) {
    console.error('获取消息出错:', err);
    res.status(500).json({ success: false, error: '获取消息失败' });
  }
});

module.exports = router;
