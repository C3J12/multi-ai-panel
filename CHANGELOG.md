# AI Panel 更新日志

## 2026-05-04

### Phase 4 - System Prompt 自定义

#### 新增功能
- 🧠 **System Prompt 设置弹窗** — 点击聊天窗口右上角 ⚙️ 齿轮图标，打开可视化编辑弹窗，自定义 AI 行为规则与角色定位。
- 💾 **默认值持久化** — 默认 System Prompt 保存到 localStorage，刷新页面不丢失。
- 🗂️ **按对话独立存储** — 每个对话可拥有独立的 System Prompt，存入数据库 `conversations.systemPrompt` 字段。
- 🔄 **AI 调用自动注入** — 发送消息时，后端自动将当前对话的 System Prompt 作为 `system` 角色消息前置到 messages 数组首位。
- 📋 **状态实时显示** — 聊天窗口标题栏下方实时显示当前对话的 System Prompt 状态（对话级/默认级/未设置）。

#### 新增文件
- `client/src/components/SystemPromptModal.jsx` — System Prompt 设置弹窗组件

#### 修改文件
- `server/db/init.sql` — conversations 表新增 `systemPrompt TEXT DEFAULT NULL`
- `server/db/connection.js` — 数据库迁移逻辑、CRUD 更新、新增 `updateConversationSystemPrompt`
- `server/api/conversations.js` — POST 接口接受 `systemPrompt` 请求体
- `server/api/chat.js` — `buildMessagesArray` 支持 system message 前置
- `client/src/context/ChatContext.jsx` — 新增 `defaultSystemPrompt`/`currentSystemPrompt` 状态管理
- `client/src/components/ChatWindow.jsx` — 标题栏添加 ⚙️ 设置按钮 + 三段式状态提示

---

## 2026-05-03

### 已完成更新

#### Phase 1 - 后端多轮对话系统
- 完成 SQLite 本地存储，自动持久化对话与消息历史。
- 增加对话管理 API：
  - `GET /api/conversations`
  - `POST /api/conversations`
  - `GET /api/conversations/:id`
  - `PUT /api/conversations/:id`
  - `DELETE /api/conversations/:id`
- 完成多轮聊天 SSE 流式接口：
  - `POST /api/chat`
  - 支持多个 AI 模型并发返回
  - 支持历史上下文拼接（最近 20 轮对话）
- 后端可执行程序入口：`server/index.js`
- 新增依赖：`better-sqlite3`, `uuid`

#### Phase 2 - 前端多会话 UI
- 重构前端为两栏布局：左侧对话列表，右侧主聊天区。
- 实现聊天上下文状态管理：`client/src/context/ChatContext.jsx`
- 实现聊天钩子：`client/src/hooks/useChat.js`
- 实现对话 Sidebar：`client/src/components/Sidebar.jsx`
- 实现主聊天区：`client/src/components/ChatWindow.jsx`
- 实现历史消息列表：`client/src/components/MessageList.jsx`
- 实现输入框与模型选择：`client/src/components/InputBox.jsx`
- 重构 App 入口：`client/src/App.jsx`
- 前端构建验证通过：`npm --prefix client run build`

#### Phase 3 - 前端本地持久化
- 实现 localStorage 缓存当前对话 ID
- 实现 localStorage 缓存选中模型设置
- 实现 localStorage 缓存对话列表，刷新页面后恢复 UI

### 运行说明

1. 后端启动
```bash
cd server
node index.js
```

2. 前端启动
```bash
cd client
npm run dev
```

3. 访问地址
- 前端：`http://localhost:5173`
- 后端：`http://localhost:4000`

### 环境变量

在 `server/.env` 中配置：
```text
DEEPSEEK_API_KEY=sk-xxx
ALI_API_KEY=sk-xxx
PORT=4000
DATABASE_PATH=./ai-panel.db
```

### 当前状态

- 后端多轮对话核心功能已完成
- 前端多会话界面已完成并联调通过
- 前端和后端联调测试成功
- 项目已可用于本地开发和浏览器访问

### 备注

- 当前系统为个人使用版本，无需用户认证。
- 对话历史使用本地 SQLite 存储，无需额外数据库服务。
- `README.md` 已更新，包含最新功能说明与运行方式。
