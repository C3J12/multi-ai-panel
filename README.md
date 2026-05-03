# 🤖 AI Panel - 多模型多轮对话系统

一个统一的浏览器界面，可以同时和多个国产 AI（**DeepSeek**、**阿里云通义千问** 等）进行**不间断的多轮对话**，支持完整的上下文保留、历史记录、实时流式展示。

## ✨ 功能亮点

### 🎯 核心功能
- 🧠 **多模型并发对话** - 一次提问，同时向多个 AI 发送，并发流式返回
- 💬 **多轮对话上下文** - 完整保留对话历史，每次提问都携带前面的对话内容
- 📚 **对话管理** - 创建多个独立对话、切换、删除，像 ChatGPT 一样
- 💾 **历史记录持久化** - SQLite 本地存储，刷新页面后数据完全恢复
- 🧭 **本地缓存恢复** - localStorage 保存当前对话和模型选择，页面刷新后继续使用
- 📱 **实时流式显示** - 答案一个字一个字显示，无需等待完整回答
- 🛑 **随时中断** - 可以在任意时刻停止 AI 的回答
- 🎨 **错误区分** - 余额不足/其他错误自动识别，界面自动变灰提示
- 🧠 **System Prompt 自定义** - 为每个新对话设置固定的 AI 行为规则与角色定位

### ⚙️ 技术特性
- 📦 **SSE 流式传输** - 高效的服务器推送事件
- 🔐 **上下文管理** - 自动剪裁消息历史以节省 token（最近 20 轮对话）
- ⚡ **高并发处理** - 支持多个 AI 同时响应
- 🔄 **自动保存** - 每条消息实时写入数据库，无数据丢失

## 🛠 技术栈
- **前端**：React 19 + Vite 8 + Tailwind CSS v4
- **后端**：Node.js + Express + SQLite
- **数据库**：SQLite (better-sqlite3)
- **AI 调用**：OpenAI SDK（兼容接口）
- **启动管理**：concurrently（一键启动前后端）

## 📋 开发阶段

### Phase 1 ✅ 后端多轮对话系统 (已完成)
- ✅ SQLite 数据库设计 (conversations + messages 表)
- ✅ 对话管理 API (创建、查询、删除)
- ✅ 多轮聊天 API (支持历史消息上下文)
- ✅ 消息持久化 (自动保存用户问题和 AI 回答)
- ✅ 所有 API 已测试通过

**新增后端文件**：
- `server/db/init.sql` - 数据库初始化
- `server/db/connection.js` - SQLite CRUD 模块
- `server/api/conversations.js` - 对话 API
- `server/api/chat.js` - 多轮聊天 API
- `server/index.js` - 已改造，集成新路由

**新增依赖**：
```bash
npm install better-sqlite3 uuid
```

### Phase 2 ✅ 前端多对话 UI (已完成)
- ✅ 前端全局状态管理 (ChatContext)
- ✅ 两栏布局 (Sidebar + ChatWindow)
- ✅ 对话列表、切换、创建
- ✅ 多轮聊天消息显示
- ✅ 连接后端 API
- ✅ 前端与后端联调通过

### Phase 3 ✅ 前端本地持久化 (已完成)
- ✅ localStorage 缓存当前对话 ID
- ✅ localStorage 缓存选中模型列表
- ✅ localStorage 缓存对话列表，页面刷新后恢复 UI

### Phase 4 ✅ System Prompt 自定义 (已完成)
- ✅ System Prompt 设置弹窗（可视化编辑）
- ✅ 默认值 localStorage 持久化
- ✅ 按对话独立存储（数据库 `systemPrompt` 字段）
- ✅ AI 调用时自动前置 system message
- ✅ 界面实时显示当前 System Prompt 状态

**新增文件**：
- `client/src/components/SystemPromptModal.jsx` - System Prompt 设置弹窗组件

## 🚀 快速开始

### 启动项目
**Windows**: 双击 `start.bat`  
**或手动**:
```bash
npm run dev
```

然后浏览器打开 http://localhost:5173

### 环境配置
在 `server/.env` 中配置 API 密钥：
```
DEEPSEEK_API_KEY=sk-xxx
ALI_API_KEY=sk-xxx
PORT=4000
DATABASE_PATH=./ai-panel.db
```

## 📡 API 文档

### 对话管理
- `GET /api/conversations` - 获取所有对话
- `POST /api/conversations` - 创建新对话（可选字段: `title`, `systemPrompt`）
- `GET /api/conversations/:id` - 获取对话详情及消息
- `PUT /api/conversations/:id` - 更新对话标题
- `DELETE /api/conversations/:id` - 删除对话

### 多轮聊天 (SSE 流式)
```json
POST /api/chat
请求体: { conversationId, question, selectedModels }
返回: 流式 SSE (start → chunks → done → end)
说明: 自动前置当前对话的 systemPrompt 作为 system message
```

## 📊 数据库设计

### conversations 表
```sql
id TEXT PRIMARY KEY
title TEXT -- 对话标题
createdAt TEXT -- 创建时间
updatedAt TEXT -- 最后更新时间
systemPrompt TEXT -- System Prompt（可选，用于 AI 行为设定）
```

### messages 表
```sql
id TEXT PRIMARY KEY
conversationId TEXT FOREIGN KEY
role TEXT -- 'user' | 'assistant'
model TEXT -- 'deepseek' | 'ali-qwen' | null
content TEXT -- 消息内容
timestamp TEXT -- 时间戳
```

## 🔧 开发工具

查看详细的实现计划和进度：[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

查看本次更新日志：[CHANGELOG.md](CHANGELOG.md)