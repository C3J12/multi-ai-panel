import React, { useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { MODEL_CONFIGS } from '../context/ChatContext';

export function MessageList() {
  const { currentMessages, selectedModels, modelErrors } = useChat();
  const messagesEndRef = useRef(null);

  const latestQuestion = useMemo(() => {
    const userMessages = currentMessages.filter(msg => msg.role === 'user');
    return userMessages.length > 0 ? userMessages[userMessages.length - 1].content : '';
  }, [currentMessages]);

  if (!selectedModels || selectedModels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">请选择至少一个 AI 模型</p>
          <p className="text-sm mt-2">在输入框上方勾选模型后，卡片会自动生成</p>
        </div>
      </div>
    );
  }

  const modelHistories = useMemo(() => {
    const histories = {};

    selectedModels.forEach(modelId => {
      histories[modelId] = [];
    });

    currentMessages.forEach(msg => {
      if (msg.role === 'assistant' && msg.model && histories[msg.model]) {
        histories[msg.model].push(msg);
      }
    });

    return histories;
  }, [currentMessages, selectedModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, selectedModels]);

  if (!currentMessages || currentMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">💭 开始新对话吧</p>
          <p className="text-sm mt-2">在下面输入你的问题</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col">
      {/* 共享问题区域 - 跨越两个卡片 */}
      {latestQuestion && (
        <div className="mb-6">
          <div className="rounded-2xl border border-blue-300 bg-blue-50 p-5 text-sm text-blue-900 shadow-sm">
            <div className="text-xs uppercase opacity-70 font-semibold mb-2">📝 最新问题</div>
            <div className="whitespace-pre-wrap break-words text-base leading-relaxed">{latestQuestion}</div>
          </div>
        </div>
      )}

      {/* 模型卡片网格 - 回答区域对齐 */}
      <div className="flex-1 grid gap-4 lg:grid-cols-2 auto-rows-max">
        {selectedModels.map(modelId => {
          const modelConfig = MODEL_CONFIGS[modelId] || {
            name: modelId,
            bgColor: 'bg-gray-100',
            borderColor: 'border-gray-300',
            textColor: 'text-gray-800'
          };
          const history = modelHistories[modelId] || [];
          const hasError = Boolean(modelErrors[modelId]);

          return (
            <div
              key={modelId}
              className="flex flex-col rounded-3xl border bg-slate-50 shadow-sm overflow-hidden"
            >
              <div
                className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${modelConfig.bgColor} ${modelConfig.textColor} ${modelConfig.borderColor}`}
              >
                <div>
                  <div className="text-base font-semibold">{modelConfig.name}</div>
                  <div className="text-xs opacity-70">
                    {history.length > 0
                      ? `历史回答 ${history.length} 条`
                      : '尚未收到回答'}
                  </div>
                </div>
                {hasError && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                    错误
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {history.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500 text-center">
                    {hasError ? '该模型当前返回失败，请查看错误提示。' : '该模型还没有回答，提问后将会在这里显示结果。'}
                  </div>
                ) : (
                  history.map((msg, index) => (
                    <div
                      key={msg.id}
                      id={`answer-${msg.id}`}
                      className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3 text-xs text-gray-500">
                        <span>回答 {index + 1}</span>
                        <span>{new Date(msg.timestamp).toLocaleString('zh-CN')}</span>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-800">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2">{children}</p>,
                            code: ({ inline, children }) =>
                              inline ? (
                                <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">
                                  {children}
                                </code>
                              ) : (
                                <pre className="bg-slate-100 p-3 rounded overflow-x-auto mb-2">
                                  <code className="font-mono text-xs">{children}</code>
                                </pre>
                              ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:opacity-80"
                              >
                                {children}
                              </a>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-2">{children}</ol>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-slate-300 pl-4 italic opacity-80 mb-2">
                                {children}
                              </blockquote>
                            )
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
