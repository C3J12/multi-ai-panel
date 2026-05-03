import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import { SystemPromptModal } from './SystemPromptModal';
import { useChat } from '../hooks/useChat';

export function ChatWindow() {
  const { currentConversationId, conversations, currentSystemPrompt, defaultSystemPrompt } = useChat();
  const [showSystemPromptModal, setShowSystemPromptModal] = useState(false);

  const currentConv = conversations.find(c => c.id === currentConversationId);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 顶部标题栏 */}
      <div className="border-b border-gray-300 bg-gradient-to-r from-blue-50 to-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {currentConv ? currentConv.title : '选择或创建对话'}
            </h2>
            {currentConv && (
              <p className="text-xs text-gray-500 mt-1">
                创建于 {new Date(currentConv.createdAt).toLocaleString('zh-CN')}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowSystemPromptModal(true)}
            className="p-2 hover:bg-blue-100 rounded-lg transition text-gray-500 hover:text-blue-600"
            title="System Prompt 设置"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        {/* System Prompt 状态提示 */}
        {currentConversationId && (
          <div className="mt-2">
            {currentSystemPrompt ? (
              /* 情况1：当前对话有自己的 System Prompt */
              <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <span>📋</span>
                <span className="truncate max-w-lg">
                  System Prompt: {currentSystemPrompt.length > 60
                    ? currentSystemPrompt.substring(0, 60) + '...'
                    : currentSystemPrompt}
                </span>
              </div>
            ) : defaultSystemPrompt ? (
              /* 情况2：无对话级 prompt，但有默认值 */
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span>📋</span>
                <span className="truncate max-w-md">
                  默认 System Prompt（新对话生效）: {defaultSystemPrompt.length > 50
                    ? defaultSystemPrompt.substring(0, 50) + '...'
                    : defaultSystemPrompt}
                </span>
                <button
                  onClick={() => setShowSystemPromptModal(true)}
                  className="text-blue-500 hover:text-blue-700 underline ml-auto shrink-0"
                >
                  修改
                </button>
              </div>
            ) : (
              /* 情况3：完全未设置 */
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>📋</span>
                <span>未设置 System Prompt</span>
                <button
                  onClick={() => setShowSystemPromptModal(true)}
                  className="text-blue-500 hover:text-blue-700 underline ml-1"
                >
                  去设置
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* System Prompt 设置弹窗 */}
      <SystemPromptModal
        isOpen={showSystemPromptModal}
        onClose={() => setShowSystemPromptModal(false)}
      />

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
