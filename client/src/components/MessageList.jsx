import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { MODEL_CONFIGS } from '../context/ChatContext';

export function MessageList() {
  const { currentMessages } = useChat();
  const messagesEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

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
    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
      {currentMessages.map((msg, index) => {
        const isUser = msg.role === 'user';
        const modelConfig = msg.model ? MODEL_CONFIGS[msg.model] : null;

        return (
          <div
            key={msg.id}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-2xl px-4 py-3 rounded-lg ${
                isUser
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : msg.content.startsWith('[错误]')
                  ? 'bg-red-100 text-red-800 border border-red-300 rounded-bl-none'
                  : `${modelConfig?.bgColor || 'bg-gray-100'} ${modelConfig?.textColor || 'text-gray-800'} border ${modelConfig?.borderColor || 'border-gray-300'} rounded-bl-none`
              }`}
            >
              {/* 消息头 */}
              {!isUser && (
                <div className="text-xs font-semibold mb-2 opacity-70">
                  {modelConfig?.name || msg.model || '系统'}
                </div>
              )}

              {/* 消息内容 */}
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              ) : (
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2">{children}</p>,
                      code: ({ inline, children }) =>
                        inline ? (
                          <code className="bg-black bg-opacity-20 px-1 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-black bg-opacity-20 p-2 rounded overflow-x-auto mb-2">
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
                        <blockquote className="border-l-4 border-current pl-4 italic opacity-80 mb-2">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* 时间戳 */}
              <div className="text-xs opacity-50 mt-2">
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN')}
              </div>
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
