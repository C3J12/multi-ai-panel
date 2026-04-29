import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // ← 新增

const AI_MODELS = [
  { id: 'deepseek', name: 'DeepSeek', 
    defaultColor: 'bg-blue-100 border-blue-400', 
    errorColor: 'bg-gray-200 border-gray-400'  },
  { id: 'ali-qwen', name: '通义千问', 
  defaultColor: 'bg-orange-100 border-orange-400',  // 改为橙色
  errorColor: 'bg-gray-200 border-gray-400'  },
];

export default function App() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 用于显示连接状态
  const [modelErrors, setModelErrors] = useState({}); // 例如 { deepseek: '余额不足', 'ali-qwen': null }
  const [focusedModel, setFocusedModel] = useState(null); // 被点击的模型 id
  const abortRef = useRef(null);
  const handleSubmit = async () => {
    // 1. 清空并准备开始
    if (!question.trim()) return;
    
    setLoading(true);
    abortRef.current = new AbortController(); 
    setModelErrors({});
    setStatus('正在连接...');
    
    const emptyAnswers = {};
    AI_MODELS.forEach(m => { emptyAnswers[m.id] = ''; });
    setAnswers(emptyAnswers);

    try {
      // 2. 建立连接
      const response = await fetch('http://localhost:4000/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question,
          models: ['deepseek', 'ali-qwen'],
        }),
        signal: abortRef.current.signal,
      });
      setQuestion('');     // ← 新增这一行！发送后自动清空输入框
      if (!response.ok) {
        throw new Error(`服务器连接失败 (状态码: ${response.status})`);
      }

      setStatus('连接成功，等待回答...');

      // 3. 读取流式回答
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setStatus('回答完成');
          break;
        }

        // 将接收到的数据块解码为文本
        buffer += decoder.decode(value, { stream: true });
        
        // 按行处理
        const lines = buffer.split('\n');
        // 保留最后一个可能不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          // 只处理以 'data: ' 开头的行
          if (!line.startsWith('data: ')) continue;
          
          const dataStr = line.substring(6); // 去掉 'data: ' 前缀
          if (!dataStr) continue; // 跳过空数据

          try {
            const data = JSON.parse(dataStr);
            
            // 根据消息类型处理
            if (data.type === 'chunk') {
              setStatus('接收回答中...');
              // 拼接文本
              setAnswers(prev => ({
                ...prev,
                [data.model]: (prev[data.model] || '') + data.content,
              }));
                        } else if (data.type === 'error') {
              // 记录具体模型错误，根据错误类型展示不同信息
              const errMsg = data.content || '未知错误';
              const isBalanceError = errMsg.includes('Insufficient Balance') || errMsg.includes('余额不足');
              setModelErrors(prev => ({
                ...prev,
                [data.model]: isBalanceError ? '余额不足，请充值' : errMsg,
              }));
              // 不中断整体状态，但可以显示一个短暂提示
              setStatus(`${data.model} 出错: ${isBalanceError ? '余额不足' : errMsg}`);
            } else if (data.type === 'done') {
              // 单个模型完成，可以不做特别处理
            }
          } catch (e) {
            // 不是合法的JSON行，跳过
          }
        }
      }

    } catch (error) {
  if (error.name !== 'AbortError') {
    console.error('请求失败:', error);
    setStatus(`请求失败: ${error.message}`);
  } else {
    setStatus('已停止');
  }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>🤖 我问，AI答</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="输入你的问题... (例如：用Java写一个冒泡排序)"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
          onClick={handleSubmit}
          disabled={loading || !question.trim()}
        >
          {loading ? 'AI思考中...' : '发送'}
        </button>
        {loading && (
  <button
    style={{
      padding: '12px 24px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold'
    }}
    onClick={() => {
      if (abortRef.current) {
        abortRef.current.abort();
        setLoading(false);
        setStatus('已停止');
      }
    }}
  >
    停止
  </button>
)}
      </div>

      <p style={{ color: 'gray', marginBottom: '10px' }}>状态: {status || '就绪'}</p>

      <div style={{ display: 'grid', gap: '20px' }}>
                {AI_MODELS.map(model => {
          const error = modelErrors[model.id];
          const bgColor = error ? 'bg-gray-100' : model.defaultColor.split(' ')[0]; // 提取第一个背景色类
          const borderColor = error ? 'border-gray-400' : model.defaultColor.split(' ')[1]; // 提取边框色类
          
          return (
            <div
              key={model.id}
              className={`border-2 rounded-xl p-4 transition-all duration-200 ${bgColor} ${borderColor} ${error ? 'opacity-75' : ''}`}
              style={{
                height: '16rem',          // 固定高度
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={() => setFocusedModel(model.id)}
            >
              <h3 className="font-semibold mb-2" style={{ flexShrink: 0 }}>
                {model.name}
                {error && <span className="text-xs text-red-500 ml-2">({error})</span>}
              </h3>
              
              {/* 回答内容区域，内部可滚动 */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                color: error ? '#6b7280' : '#1f2937'
              }}>
                {error ? (
                  <div className="text-center text-gray-500 mt-8">
                    {error === '余额不足，请充值' ? '💰 余额不足，请充值后再试' : `⚠️ ${error}`}
                  </div>
                ) : (
                  answers[model.id] || (loading ? '⏳ 等待回答中...' : '💤 等待提问')
                )}
              </div>

            </div>
          );
          
        })}
      </div>
            {/* 模态框 */}
      {focusedModel && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setFocusedModel(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-3/4 flex flex-col p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {AI_MODELS.find(m => m.id === focusedModel)?.name} 的完整回答
              </h2>
              <button
                onClick={() => setFocusedModel(null)}
                className="text-gray-500 hover:text-black text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-auto prose max-w-none">
              {answers[focusedModel] ? (
                <ReactMarkdown>{answers[focusedModel]}</ReactMarkdown>
              ) : modelErrors[focusedModel] ? (
                <div className="text-red-500">⚠️ {modelErrors[focusedModel]}</div>
              ) : (
                <div className="text-gray-400">暂无内容</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}