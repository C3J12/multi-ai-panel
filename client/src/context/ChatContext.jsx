import React, { createContext, useState, useCallback } from 'react';

export const ChatContext = createContext();

export function ChatProvider({ children }) {
  // 状态定义
  const STORAGE_KEYS = {
    selectedModels: 'ai-panel-selected-models',
    currentConversationId: 'ai-panel-current-conversation-id',
    conversations: 'ai-panel-conversations-cache',
    defaultSystemPrompt: 'ai-panel-default-system-prompt'
  };

  const loadStoredSelectedModels = () => {
    if (typeof window === 'undefined') return ['deepseek', 'ali-qwen'];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.selectedModels);
      return raw ? JSON.parse(raw) : ['deepseek', 'ali-qwen'];
    } catch {
      return ['deepseek', 'ali-qwen'];
    }
  };

  const loadStoredConversationId = () => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEYS.currentConversationId);
  };

  const loadStoredConversations = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.conversations);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const loadStoredDefaultSystemPrompt = () => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(STORAGE_KEYS.defaultSystemPrompt) || '';
    } catch {
      return '';
    }
  };

  const persistSelectedModels = (models) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.selectedModels, JSON.stringify(models));
  };

  const persistCurrentConversationId = (conversationId) => {
    if (typeof window === 'undefined') return;
    if (!conversationId) {
      window.localStorage.removeItem(STORAGE_KEYS.currentConversationId);
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.currentConversationId, conversationId);
  };

  const persistConversations = (list) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(list));
    } catch {
      // ignore storage errors
    }
  };

  const persistDefaultSystemPrompt = (prompt) => {
    if (typeof window === 'undefined') return;
    try {
      if (prompt) {
        window.localStorage.setItem(STORAGE_KEYS.defaultSystemPrompt, prompt);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.defaultSystemPrompt);
      }
    } catch {
      // ignore storage errors
    }
  };

  const [conversations, setConversations] = useState(loadStoredConversations() || []);
  const [currentConversationId, setCurrentConversationId] = useState(loadStoredConversationId());
  const [currentMessages, setCurrentMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModels, setSelectedModels] = useState(loadStoredSelectedModels);
  const [error, setError] = useState(null);
  const [modelErrors, setModelErrors] = useState({}); // 记录各模型的错误
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState(loadStoredDefaultSystemPrompt);
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState('');

  const API_BASE = 'http://localhost:4000/api';

  // ==================== 对话管理 ====================

  /**
   * 加载某个对话的消息
   */
  const loadMessages = useCallback(async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`);
      const data = await res.json();
      if (data.success) {
        setCurrentMessages(data.messages);
        if (data.conversation && data.conversation.systemPrompt) {
          setCurrentSystemPrompt(data.conversation.systemPrompt);
        } else {
          setCurrentSystemPrompt('');
        }
      }
    } catch (err) {
      console.error('加载消息失败:', err);
      setError('加载消息失败');
    }
  }, []);

  /**
   * 初始化：加载所有对话
   */
  const loadConversations = useCallback(async () => {
    try {
      const cached = loadStoredConversations();
      if (cached && cached.length > 0) {
        setConversations(cached);
      }

      const res = await fetch(`${API_BASE}/conversations`);
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations);
        persistConversations(data.conversations);

        // 尝试恢复本地保存的当前对话
        const storedId = loadStoredConversationId();
        const matched = data.conversations.find(conv => conv.id === storedId);
        if (matched) {
          setCurrentConversationId(matched.id);
          persistCurrentConversationId(matched.id);
          await loadMessages(matched.id);
          return;
        }

        if (data.conversations.length > 0) {
          const fallbackId = data.conversations[0].id;
          setCurrentConversationId(fallbackId);
          persistCurrentConversationId(fallbackId);
          await loadMessages(fallbackId);
        }
      }
    } catch (err) {
      console.error('加载对话列表失败:', err);
      setError('加载对话列表失败');
    }
  }, [currentConversationId, loadMessages]);

  /**
   * 创建新对话
   */
  const createConversation = useCallback(async (title = '新对话', systemPrompt = null) => {
    try {
      const prompt = systemPrompt !== null ? systemPrompt : defaultSystemPrompt;
      const res = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, systemPrompt: prompt || undefined })
      });
      const data = await res.json();
      if (data.success) {
        const newConv = data.conversation;
        setConversations(prev => {
          const list = [newConv, ...prev];
          persistConversations(list);
          return list;
        });
        setCurrentConversationId(newConv.id);
        persistCurrentConversationId(newConv.id);
        setCurrentMessages([]);
        setCurrentSystemPrompt(prompt || '');
        setModelErrors({});
        return newConv;
      }
    } catch (err) {
      console.error('创建对话失败:', err);
      setError('创建对话失败');
    }
  }, [defaultSystemPrompt]);

  /**
   * 删除对话
   */
  const deleteConversation = useCallback(async (convId) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => {
          const updated = prev.filter(c => c.id !== convId);
          persistConversations(updated);
          return updated;
        });
        // 如果删除的是当前对话，切换到第一个
        if (convId === currentConversationId) {
          const remaining = conversations.filter(c => c.id !== convId);
          if (remaining.length > 0) {
            setCurrentConversationId(remaining[0].id);
            persistCurrentConversationId(remaining[0].id);
            await loadMessages(remaining[0].id);
          } else {
            setCurrentConversationId(null);
            persistCurrentConversationId(null);
            setCurrentMessages([]);
          }
        }
      }
    } catch (err) {
      console.error('删除对话失败:', err);
      setError('删除对话失败');
    }
  }, [currentConversationId, conversations, loadMessages]);

  /**
   * 切换当前对话
   */
  const switchConversation = useCallback(async (convId) => {
    setCurrentConversationId(convId);
    persistCurrentConversationId(convId);
    setModelErrors({});
    // 从本地缓存中查找该对话的 systemPrompt
    const conv = conversations.find(c => c.id === convId);
    if (conv && conv.systemPrompt) {
      setCurrentSystemPrompt(conv.systemPrompt);
    } else {
      setCurrentSystemPrompt('');
    }
    await loadMessages(convId);
  }, [loadMessages, conversations]);

  /**
   * 更新对话标题
   */
  const updateConversationTitle = useCallback(async (convId, newTitle) => {
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      const data = await res.json();
      if (data.success) {
        setConversations(prev => {
          const updated = prev.map(c => c.id === convId ? data.conversation : c);
          persistConversations(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('更新标题失败:', err);
    }
  }, []);

  // ==================== 消息发送 ====================

  /**
   * 核心：发送消息 (流式接收)
   */
  const sendMessage = useCallback(async (question) => {
    if (!currentConversationId || !question.trim()) {
      setError('请先选择对话并输入问题');
      return;
    }

    setLoading(true);
    setModelErrors({});
    setError(null);

    const abortController = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversationId,
          question,
          selectedModels: selectedModels.filter(m => MODEL_CONFIGS[m])
        }),
        signal: abortController.signal
      });

      if (!res.ok) {
        throw new Error(`服务器错误: ${res.status}`);
      }

      // 处理流式响应
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let userMessageAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const dataStr = line.substring(6);
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            // 流式消息处理
            if (data.type === 'start') {
              // 开始标记
              if (!userMessageAdded) {
                // 重新加载消息以获取保存的用户消息
                await loadMessages(currentConversationId);
                userMessageAdded = true;
              }
            } else if (data.type === 'chunk') {
              // 接收 AI 回答 chunk
              setCurrentMessages(prev => {
                const messages = [...prev];
                let aiMsg = messages.find(m => m.model === data.model && m.role === 'assistant');
                
                if (!aiMsg) {
                  // 创建新的 AI 消息
                  aiMsg = {
                    id: `temp-${data.model}-${Date.now()}`,
                    conversationId: currentConversationId,
                    role: 'assistant',
                    model: data.model,
                    content: data.content,
                    timestamp: new Date().toISOString()
                  };
                  messages.push(aiMsg);
                } else {
                  // 追加到现有消息
                  aiMsg.content += data.content;
                }
                return messages;
              });
            } else if (data.type === 'error') {
              // 错误处理
              setModelErrors(prev => ({
                ...prev,
                [data.model]: data.content
              }));
              // 也添加错误消息到消息列表
              setCurrentMessages(prev => {
                const errorMsg = {
                  id: `error-${data.model}-${Date.now()}`,
                  conversationId: currentConversationId,
                  role: 'assistant',
                  model: data.model,
                  content: `[错误] ${data.content}`,
                  timestamp: new Date().toISOString()
                };
                return [...prev, errorMsg];
              });
            }
          } catch (e) {
            // JSON 解析错误，忽略
          }
        }
      }

      // 重新加载消息以获取最终的数据库状态
      await loadMessages(currentConversationId);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('发送消息失败:', err);
        setError(`发送失败: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentConversationId, selectedModels, loadMessages]);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * 更新选中的模型
   */
  const updateSelectedModels = useCallback((models) => {
    setSelectedModels(models);
    persistSelectedModels(models);
  }, []);

  /**
   * 更新默认 System Prompt
   */
  const updateDefaultSystemPrompt = useCallback((prompt) => {
    setDefaultSystemPrompt(prompt);
    persistDefaultSystemPrompt(prompt);
  }, []);

  // 提供值
  const value = {
    // 状态
    conversations,
    currentConversationId,
    currentMessages,
    loading,
    selectedModels,
    error,
    modelErrors,
    defaultSystemPrompt,
    currentSystemPrompt,
    // 方法
    loadConversations,
    createConversation,
    deleteConversation,
    switchConversation,
    updateConversationTitle,
    sendMessage,
    clearError,
    updateSelectedModels,
    updateDefaultSystemPrompt,
    loadMessages
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// 模型配置（前端视图用）
export const MODEL_CONFIGS = {
  'deepseek': {
    name: 'DeepSeek',
    color: '#3B82F6', // 蓝色
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-700'
  },
  'ali-qwen': {
    name: '通义千问',
    color: '#F97316', // 橙色
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-400',
    textColor: 'text-orange-700'
  }
};
