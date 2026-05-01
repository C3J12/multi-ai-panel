const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库路径（优先使用环境变量，否则使用本地默认路径）
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../ai-panel.db');

// 确保数据库文件夹存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接（单例模式）
let db = null;

function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL'); // 启用 WAL 模式提升并发性能
    db.pragma('foreign_keys = ON');   // 启用外键约束
    initializeDatabase();
  }
  return db;
}

// 初始化数据库表
function initializeDatabase() {
  const initSQL = fs.readFileSync(path.join(__dirname, './init.sql'), 'utf-8');
  const statements = initSQL.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (err) {
      // 表已存在的错误可以忽略
      if (!err.message.includes('already exists')) {
        console.error('数据库初始化错误:', err);
        throw err;
      }
    }
  }
}

// ==================== 对话相关操作 ====================

/**
 * 获取所有对话（按更新时间倒序）
 */
function getConversations() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, title, createdAt, updatedAt 
    FROM conversations 
    ORDER BY updatedAt DESC
  `);
  return stmt.all();
}

/**
 * 获取单个对话详情
 */
function getConversation(conversationId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, title, createdAt, updatedAt 
    FROM conversations 
    WHERE id = ?
  `);
  return stmt.get(conversationId);
}

/**
 * 创建新对话
 */
function createConversation(id, title = '未命名对话') {
  const db = getDatabase();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO conversations (id, title, createdAt, updatedAt)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, title, now, now);
  return { id, title, createdAt: now, updatedAt: now };
}

/**
 * 删除对话（级联删除相关消息）
 */
function deleteConversation(conversationId) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM conversations WHERE id = ?');
  stmt.run(conversationId);
}

/**
 * 更新对话标题
 */
function updateConversationTitle(conversationId, title) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE conversations 
    SET title = ?, updatedAt = ? 
    WHERE id = ?
  `);
  stmt.run(title, now, conversationId);
}

/**
 * 仅更新对话的 updatedAt 时间戳
 */
function updateConversationTime(conversationId) {
  const db = getDatabase();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE conversations 
    SET updatedAt = ? 
    WHERE id = ?
  `);
  stmt.run(now, conversationId);
}

// ==================== 消息相关操作 ====================

/**
 * 获取对话的所有消息（按时间正序）
 */
function getMessages(conversationId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, conversationId, role, model, content, timestamp 
    FROM messages 
    WHERE conversationId = ? 
    ORDER BY timestamp ASC
  `);
  return stmt.all(conversationId);
}

/**
 * 获取对话的最近 N 条消息
 */
function getRecentMessages(conversationId, limit = 50) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, conversationId, role, model, content, timestamp 
    FROM messages 
    WHERE conversationId = ? 
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  const messages = stmt.all(conversationId, limit);
  return messages.reverse(); // 反转回正序
}

/**
 * 添加消息
 */
function addMessage(id, conversationId, role, content, model = null) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversationId, role, model, content, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, conversationId, role, model, content, timestamp);
  
  // 更新对话的 updatedAt 时间
  updateConversationTime(conversationId);
  
  return { id, conversationId, role, model, content, timestamp };
}

/**
 * 更新消息内容（用于追加流式消息）
 */
function updateMessageContent(messageId, newContent) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE messages 
    SET content = ? 
    WHERE id = ?
  `);
  stmt.run(newContent, messageId);
}

/**
 * 删除消息
 */
function deleteMessage(messageId) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
  stmt.run(messageId);
}

/**
 * 清空对话的所有消息
 */
function clearMessages(conversationId) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM messages WHERE conversationId = ?');
  stmt.run(conversationId);
}

// ==================== 导出所有方法 ====================

module.exports = {
  getDatabase,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  updateConversationTitle,
  updateConversationTime,
  getMessages,
  getRecentMessages,
  addMessage,
  updateMessageContent,
  deleteMessage,
  clearMessages
};
