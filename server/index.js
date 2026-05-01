require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== 导入 API 模块 ====================
const conversationsAPI = require('./api/conversations');
const chatAPI = require('./api/chat');

// ==================== 挂载 API 路由 ====================
app.use('/api/conversations', conversationsAPI);
app.use('/api/chat', chatAPI);

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ 后端跑起来了 → http://localhost:${PORT}`);
});