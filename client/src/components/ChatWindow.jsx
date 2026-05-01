import React from 'react';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import { useChat } from '../hooks/useChat';

export function ChatWindow() {
  const { currentConversationId, conversations } = useChat();

  const currentConv = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="border-b border-gray-300 bg-gradient-to-r from-blue-50 to-white p-4">
        <h2 className="text-xl font-bold text-gray-800">
          {currentConv ? currentConv.title : '选择或创建对话'}
        </h2>
        {currentConv && (
          <p className="text-xs text-gray-500 mt-1">
            创建于 {new Date(currentConv.createdAt).toLocaleString('zh-CN')}
          </p>
        )}
      </div>

      {/* 消息区域和输入框 */}
      {currentConversationId ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList />
          <InputBox />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-2xl mb-2">👋</p>
            <p className="text-lg">请先创建或选择一个对话</p>
            <p className="text-sm mt-2">左侧点击"+ 新对话"开始</p>
          </div>
        </div>
      )}
    </div>
  );
}
