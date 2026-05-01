import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { MODEL_CONFIGS } from '../context/ChatContext';

export function InputBox() {
  const {
    sendMessage,
    loading,
    selectedModels,
    updateSelectedModels,
    currentConversationId,
    error,
    clearError
  } = useChat();

  const [question, setQuestion] = useState('');

  // 处理发送
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!question.trim() || loading || !currentConversationId) return;

    await sendMessage(question);
    setQuestion('');
  };

  // 处理模型勾选
  const handleModelToggle = (modelId) => {
    updateSelectedModels(
      selectedModels.includes(modelId)
        ? selectedModels.filter(m => m !== modelId)
        : [...selectedModels, modelId]
    );
  };

  return (
    <div className="border-t border-gray-300 bg-white p-4 space-y-3">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* 模型选择器 */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(MODEL_CONFIGS).map(([modelId, config]) => (
          <label
            key={modelId}
            className="flex items-center gap-2 px-3 py-1 rounded-full border-2 cursor-pointer transition"
            style={{
              borderColor: selectedModels.includes(modelId) ? config.color : '#D1D5DB',
              backgroundColor: selectedModels.includes(modelId) ? `${config.color}15` : 'transparent'
            }}
          >
            <input
              type="checkbox"
              checked={selectedModels.includes(modelId)}
              onChange={() => handleModelToggle(modelId)}
              className="rounded w-4 h-4"
            />
            <span className="text-sm font-medium">{config.name}</span>
          </label>
        ))}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="输入你的问题... (回车发送，Shift+回车换行)"
          disabled={loading || !currentConversationId}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <button
          type="submit"
          disabled={loading || !question.trim() || !currentConversationId}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? '⏳ 发送中...' : '📤 发送'}
        </button>
      </form>

      {/* 提示信息 */}
      {!currentConversationId && (
        <p className="text-xs text-gray-500">💡 请先创建或选择一个对话</p>
      )}
      {currentConversationId && selectedModels.length === 0 && (
        <p className="text-xs text-yellow-600">⚠️ 请至少选择一个 AI 模型</p>
      )}
    </div>
  );
}
