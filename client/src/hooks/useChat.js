import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

/**
 * 自定义 hook：方便在组件中使用聊天状态
 */
export function useChat() {
  const context = useContext(ChatContext);
  
  if (!context) {
    throw new Error('useChat 必须在 ChatProvider 内部使用');
  }
  
  return context;
}
