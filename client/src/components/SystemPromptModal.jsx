import React, { useState, useEffect } from 'react';
import { useChat } from '../hooks/useChat';

/**
 * System Prompt 设置弹窗
 * 允许用户编辑和保存默认的 System Prompt
 */
export function SystemPromptModal({ isOpen, onClose }) {
  const {
    defaultSystemPrompt,
    updateDefaultSystemPrompt,
    currentSystemPrompt
  } = useChat();

  const [localPrompt, setLocalPrompt] = useState('');

  // 打开弹窗时加载当前默认值
  useEffect(() => {
    if (isOpen) {
      setLocalPrompt(defaultSystemPrompt || '');
    }
  }, [isOpen, defaultSystemPrompt]);

  // 保存并关闭
  const handleSave = () => {
    updateDefaultSystemPrompt(localPrompt);
    onClose();
  };

  // 按 Esc 关闭
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              ⚙️ System Prompt 设置
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              设置 AI 助手的行为规则、角色定位、输出格式等。将应用于所有新创建的对话。
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-500 hover:text-gray-700"
            title="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 当前对话提示 */}
        {currentSystemPrompt && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <span className="font-medium">💡 当前对话</span> 正在使用独立的 System Prompt，修改默认值不会影响已有对话。
          </div>
        )}

        {/* 编辑区 */}
        <div className="px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Prompt 内容
          </label>
          <textarea
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            placeholder={`例如：
你是一个专业的编程助手，擅长 JavaScript、React、Node.js 等技术栈。
请用中文回答，代码示例需要完整可用，并附带必要的解释说明。`}
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm leading-relaxed font-mono bg-gray-50"
            autoFocus
          />
          <p className="text-xs text-gray-400 mt-2">
            留空则新对话不使用 System Prompt · 按 Ctrl+Enter 快速保存
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => {
              setLocalPrompt('');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition"
          >
            🗑️ 清空
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition"
            >
              💾 保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
