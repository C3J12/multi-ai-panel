import React, { useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { MODEL_CONFIGS } from '../context/ChatContext';

export function MessageList() {
  const { currentMessages, selectedModels, modelErrors } = useChat();
  const messagesEndRef = useRef(null);

  const questionItems = useMemo(() => {
    const items = [];
    let currentQuestion = null;

    currentMessages.forEach(msg => {
      if (msg.role === 'user') {
        currentQuestion = {
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          answers: {}
        };
        items.push(currentQuestion);
      } else if (msg.role === 'assistant' && currentQuestion) {
        const modelId = msg.model || 'unknown';
        currentQuestion.answers[modelId] = currentQuestion.answers[modelId] || [];
        currentQuestion.answers[modelId].push(msg);
      }
    });

    return items;
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, selectedModels]);

  if (!currentMessages || currentMessages.length === 0 || questionItems.length === 0) {
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
    <div className="flex-1 overflow-y-auto p-6 bg-white">
      <div className="space-y-10">
        {questionItems.map((item, index) => (
          <div key={item.id} id={`question-${item.id}`} className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">问题 #{index + 1}</div>
                  <div className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString('zh-CN')}</div>
                </div>
              </div>
              <div className="text-base leading-relaxed whitespace-pre-wrap text-slate-900">
                {item.content}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {selectedModels.map(modelId => {
                const modelConfig = MODEL_CONFIGS[modelId] || {
                  name: modelId,
                  bgColor: 'bg-gray-100',
                  borderColor: 'border-gray-300',
                  textColor: 'text-gray-800'
                };
                const answers = item.answers[modelId] || [];
                const hasError = Boolean(modelErrors[modelId] && answers.length === 0);

                return (
                  <div key={modelId} className="flex flex-col rounded-3xl border bg-slate-50 shadow-sm overflow-hidden">
                    <div className={`flex items-center justify-between gap-3 px-5 py-4 border-b ${modelConfig.bgColor} ${modelConfig.textColor} ${modelConfig.borderColor}`}>
                      <div>
                        <div className="text-base font-semibold">{modelConfig.name}</div>
                        <div className="text-xs opacity-70">
                          {answers.length > 0 ? `回答 ${answers.length} 条` : '尚未收到回答'}
                        </div>
                      </div>
                      {hasError && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">错误</span>
                      )}
                    </div>

                    <div className="p-5 space-y-4 min-h-[180px]">
                      {answers.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500 text-center">
                          该模型暂无回答，请等待当前问题回复。
                        </div>
                      ) : (
                        answers.map((msg, answerIndex) => (
                          <div key={msg.id} id={`answer-${msg.id}`} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3 mb-3 text-xs text-gray-500">
                              <span>回答 {answerIndex + 1}</span>
                              <span>{new Date(msg.timestamp).toLocaleString('zh-CN')}</span>
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-800">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-2">{children}</p>,
                                  code: ({ inline, children }) =>
                                    inline ? (
                                      <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                    ) : (
                                      <pre className="bg-slate-100 p-3 rounded overflow-x-auto mb-2"><code className="font-mono text-xs">{children}</code></pre>
                                    ),
                                  a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">{children}</a>
                                  ),
                                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-slate-300 pl-4 italic opacity-80 mb-2">{children}</blockquote>
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
          </div>
        ))}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
}
