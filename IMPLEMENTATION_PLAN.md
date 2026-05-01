# 🚀 方案 B 详细实现计划 - 多轮对话系统

## 📋 项目概览

**目标**：将单轮提问系统升级为完整的多轮对话平台
- ✅ 多个独立对话会话
- ✅ 上下文保留（发送消息时携带历史）
- ✅ 历史记录持久化（SQLite）
- ✅ 对话管理（创建、删除、切换）

**工作量**：6-8 小时（含完整测试）

---

## 🗂️ 文件结构（目标状态）

```
ai-panel/
├── server/
│   ├── index.js              (改造)
│   ├── package.json
│   ├── .env
│   ├── db/
│   │   ├── init.sql          (新增)
│   │   └── connection.js     (新增)
│   └── api/
│       ├── conversations.js  (新增)
│       └── chat.js          (新增)
│
├── client/
│   └── src/
│       ├── App.jsx           (重构)
│       ├── context/
│       │   └── ChatContext.jsx       (新增)
│       ├── components/
│       │   ├── Sidebar.jsx           (新增)
│       │   ├── ChatWindow.jsx        (新增)
│       │   ├── MessageList.jsx       (新增)
│       │   └── InputBox.jsx          (新增)
│       └── hooks/
│           └── useChat.js           (新增)
│
└── IMPLEMENTATION_PLAN.md    (本文件)
```

---

## 🎯 实现阶段

### **Phase 1: 后端数据库 & API (1-2 小时)**

#### 1.1 SQLite 数据库设计

**表结构**：

```sql
-- Conversations 表
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Messages 表
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL,          -- 'user' | 'assistant'
  model TEXT,                  -- 'deepseek' | 'ali-qwen' | null for user msg
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (conversationId) REFERENCES conversations(id)
);
```

**创建脚本**：`server/db/init.sql`
- 初始化表
- 创建索引（conversationId 查询优化）

**连接模块**：`server/db/connection.js`
- 单例模式 SQLite 连接
- 提供基础 CRUD 方法

#### 1.2 后端 API 设计

**1. 对话列表**
```
GET /api/conversations
返回: { conversations: [...] }
```

**2. 创建对话**
```
POST /api/conversations
请求: { title?: string }
返回: { id, title, createdAt }
```

**3. 获取对话详情 + 历史消息**
```
GET /api/conversations/:id
返回: { 
  id, title, 
  messages: [
    { id, role, model, content, timestamp },
    ...
  ]
}
```

**4. 删除对话**
```
DELETE /api/conversations/:id
返回: { success: true }
```

**5. 多轮聊天（SSE 流式）**⭐ **核心接口**
```
POST /api/chat
请求: {
  conversationId: string,
  question: string,
  selectedModels: ['deepseek', 'ali-qwen']
}

返回: SSE 流
data: { type: 'start', models, totalTokens? }
data: { model: 'deepseek', type: 'chunk', content: '...' }
data: { model: 'ali-qwen', type: 'chunk', content: '...' }
data: { model: 'deepseek', type: 'done' }
data: { model: 'ali-qwen', type: 'done' }
data: { type: 'end' }
```

**处理逻辑**：
```javascript
1. 验证 conversationId 存在
2. 保存用户问题到数据库 (role: 'user', model: null)
3. 获取该对话的所有历史消息
4. 构建 OpenAI messages 数组
   messages = [
     { role: 'user', content: msg1 },
     { role: 'assistant', content: response1 },
     ...
     { role: 'user', content: 最新问题 }
   ]
5. 并发调用各个 AI 模型（带上完整消息历史）
6. 流式发送 chunk → 实时保存到数据库
7. 回答完成后保存完整消息
```

#### 1.3 服务器依赖新增

```bash
npm install better-sqlite3  # 同步 SQLite（简单高效）
# 或
npm install sqlite3         # 异步（可选）
```

---

### **Phase 2: 前端状态管理 & UI (2-3 小时)**

#### 2.1 全局状态管理 (React Context)

**`client/src/context/ChatContext.jsx`**：

```javascript
export const ChatContext = createContext();

// 状态结构
{
  conversations: [
    { id, title, createdAt, updatedAt },
    ...
  ],
  currentConversationId: 'conv-123',
  currentMessages: [
    { id, role, model, content, timestamp },
    ...
  ],
  loading: false,
  selectedModels: ['deepseek', 'ali-qwen'],
  error: null
}

// 提供的 actions
- loadConversations()        // 初始化
- createConversation(title)
- deleteConversation(id)
- switchConversation(id)
- sendMessage(question)      // 核心
- selectModels(models)
- clearError()
```

#### 2.2 核心组件

**`App.jsx`** - 主容器
```jsx
<div className="flex h-screen">
  <Sidebar />
  <ChatWindow />
</div>
```

**`Sidebar.jsx`** - 左侧对话列表
- 创建新对话按钮
- 对话列表（点击切换）
- 对话项右键菜单（删除、编辑标题）
- 当前对话高亮

**`ChatWindow.jsx`** - 主聊天区
```jsx
<div className="flex-1 flex flex-col">
  <MessageList />
  <InputBox />
</div>
```

**`MessageList.jsx`** - 消息历史
- 自动滚动到底部
- 用户消息（右对齐）
- AI 回答（左对齐，按模型分组）
- Markdown 渲染
- 流式字体打字机效果

**`InputBox.jsx`** - 输入框
- 文本输入框
- 模型多选器（复选框）
- 发送按钮
- 中止按钮

**`useChat.js` Hook** - API 通信
```javascript
const { 
  conversations, 
  messages, 
  loading,
  sendMessage,
  loadConversations,
  ...
} = useChat();
```

#### 2.3 UI 布局

```
┌─────────────────────────────────────────┐
│          AI Panel - 多模型对话           │
├──────────────┬──────────────────────────┤
│   对话列表   │                          │
│            │   消息区                   │
│ [新建] [✓] │   User: 你好              │
│ [对话1]   │   DeepSeek: 你好，我是...  │
│ [对话2]   │   通义千问: 您好，我是... │
│ [对话3]   │                          │
│            │   User: 讲讲 AI           │
│            │   [加载中...]             │
│            ├──────────────────────────┤
│            │ 输入框: [         ]      │
│            │ 模型: ☐DeepSeek ☑通义  │
│            │ [发送] [中止]           │
└──────────────┴──────────────────────────┘
```

---

### **Phase 3: 数据持久化 (1 小时)**

#### 3.1 SQLite 集成

**`server/db/connection.js`**：
```javascript
const Database = require('better-sqlite3');
const db = new Database(process.env.DATABASE_PATH || 'ai-panel.db');

// 方法
- db.getConversation(id)
- db.getAllConversations()
- db.createConversation(title)
- db.deleteConversation(id)
- db.addMessage(conversationId, role, model, content)
- db.getMessages(conversationId)
```

#### 3.2 前端缓存（可选）

使用 `localStorage`：
- 缓存对话列表（减少 API 调用）
- 缓存当前对话 ID
- 缓存选中的模型列表

---

### **Phase 4: 测试 & 优化 (1 小时)**

#### 4.1 功能测试清单

- [ ] 创建新对话
- [ ] 删除对话
- [ ] 发送单条消息
- [ ] 多轮对话（验证上下文）
- [ ] 并发 AI 回答
- [ ] 消息流式显示
- [ ] 刷新页面后数据恢复
- [ ] 中止按钮正常工作
- [ ] 模型选择器生效

#### 4.2 边界情况

- [ ] 空对话的处理
- [ ] 网络断开重连
- [ ] API 错误处理
- [ ] 消息过长时的 UI 表现

#### 4.3 性能优化

- [ ] 消息分页（只加载最近 50 条）
- [ ] 对话列表虚拟滚动（> 100 个对话时）
- [ ] SSE 连接超时处理（5 分钟）

---

## 🔄 实现顺序（推荐）

```
Week 1 (第一天上午):
  ✅ Step 1: 安装 better-sqlite3，创建 db/init.sql
  ✅ Step 2: 实现 db/connection.js 基础 CRUD
  ✅ Step 3: 重写 server/index.js - 添加新 API 路由

Week 1 (第一天下午):
  ✅ Step 4: 实现 /api/conversations CRUD 接口
  ✅ Step 5: 实现 /api/chat 多轮对话接口
  ✅ Step 6: 测试后端 API

Week 2 (第二天上午):
  ✅ Step 7: 创建 ChatContext + useChat hook
  ✅ Step 8: 重构 App.jsx 为两栏布局
  ✅ Step 9: 实现 Sidebar 组件

Week 2 (第二天下午):
  ✅ Step 10: 实现 ChatWindow、MessageList、InputBox
  ✅ Step 11: 连接前端和后端 API
  ✅ Step 12: 全面测试 + 调试
  ✅ Step 13: 性能优化
```

---

## 📦 环境变量

**`.env` 示例**：
```
DEEPSEEK_API_KEY=sk-xxx
ALI_API_KEY=sk-xxx
PORT=4000
DATABASE_PATH=./ai-panel.db
```

---

## 🎨 样式参考

使用现有的 Tailwind CSS v4，保持简洁风格：
- 左侧 Sidebar：`bg-gray-100`
- 消息气泡：用户 `bg-blue-500`, AI `bg-gray-300`
- 输入框：`border-gray-300 focus:border-blue-500`

---

## ⚠️ 注意事项

1. **消息历史长度**：不要将所有消息都发给 AI（token 限制），考虑只发最近 10-20 条
2. **并发限制**：同一时间最多支持 5 个 AI 并发请求
3. **流式 UI 更新**：确保 React 状态更新不会导致频繁重渲染
4. **错误恢复**：AI 调用失败时，用户消息已保存，重试时使用该消息

---

## ✅ 完成标志

- [x] 数据库能正常创建和操作
- [x] 后端 API 全部可用
- [x] 前端能正常创建、删除、切换对话
- [x] 多轮对话上下文正确
- [x] 消息实时显示
- [x] 刷新页面后数据恢复
- [x] 无控制台错误

---

**开始时间**：现在！ 🚀
