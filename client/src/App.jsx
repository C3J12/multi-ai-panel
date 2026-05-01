import { useEffect } from 'react';
import { ChatProvider } from './context/ChatContext';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';

/**
 * 主应用组件（内部）
 * 需要在 ChatProvider 内部才能使用 useChat hook
 */
function AppContent() {
  const { loadConversations } = useChat();

  // 组件挂载时加载对话列表
  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}

/**
 * App 根组件
 * 用 ChatProvider 包裹应用以提供全局状态
 */
export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
