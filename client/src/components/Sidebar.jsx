import React, { useState } from 'react';
import { useChat } from '../hooks/useChat';

export function Sidebar() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    switchConversation,
    deleteConversation,
    updateConversationTitle
  } = useChat();

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 创建新对话
  const handleNewConversation = async () => {
    await createConversation('新对话');
  };

  // 开始编辑标题
  const startEdit = (id, title) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  // 保存标题
  const saveTitle = async (id) => {
    if (editingTitle.trim()) {
      await updateConversationTitle(id, editingTitle);
    }
    setEditingId(null);
  };

  // 删除对话
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('确定删除这个对话吗？')) {
      await deleteConversation(id);
    }
  };

  return (
    <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-300">
        <h1 className="text-xl font-bold text-gray-800 mb-3">💬 对话</h1>
        <button
          onClick={handleNewConversation}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
        >
          + 新对话
        </button>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            还没有对话，点击上面创建一个吧
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`p-3 rounded-lg cursor-pointer transition group ${
                  currentConversationId === conv.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white hover:bg-gray-50 text-gray-800'
                }`}
              >
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={() => saveTitle(conv.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveTitle(conv.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    autoFocus
                    className="w-full px-2 py-1 bg-white text-gray-800 rounded border border-gray-300 text-sm"
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs opacity-60">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          startEdit(conv.id, conv.title);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={e => handleDelete(conv.id, e)}
                        className="p-1 hover:bg-red-200 rounded"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-3 border-t border-gray-300 text-xs text-gray-600">
        <p>共 {conversations.length} 个对话</p>
      </div>
    </div>
  );
}
