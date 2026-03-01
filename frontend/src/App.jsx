import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const REQUEST_TIMEOUT_MS = 15000;

const presetTeams = [
  '마케팅 어벤져스 팀',
  '신사업 리서치 팀',
  '번역/로컬라이징 팀',
];

const initialTasks = [
  { id: 1, title: '시장 리서치', assignee: 'Researcher', status: 'running' },
  { id: 2, title: '카피 초안 작성', assignee: 'Copywriter', status: 'queued' },
  { id: 3, title: '리뷰/승인', assignee: 'Reviewer', status: 'blocked' },
];

const initialMessages = [
  {
    id: 1,
    author: 'PM Agent',
    text: '글로벌 목표를 받았습니다. 작업을 분해해서 팀에 할당할게요.',
  },
  {
    id: 2,
    author: 'Researcher',
    text: '최신 트렌드 5개 수집 중입니다. 10분 내 1차 보고 드릴게요.',
  },
];

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const connectionLabel = loading
    ? '백엔드 확인 중'
    : error
      ? '연결 실패'
      : '연결 정상';

  useEffect(() => {
    async function fetchHealth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${apiBaseUrl}/api/health`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`요청 실패: ${response.status}`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const bodyText = await response.text();
          const preview = bodyText.slice(0, 80).replace(/\s+/g, ' ');
          throw new Error(
            `JSON 응답이 아닙니다. VITE_API_BASE_URL 확인 필요 (현재: ${apiBaseUrl}) / 응답 미리보기: ${preview}`
          );
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError(
            '백엔드 응답 시간이 길어요. (Render 무료 플랜은 첫 요청이 30~60초 지연될 수 있어요) 잠시 후 새로고침 해주세요.'
          );
          return;
        }
        setError(err.message || '알 수 없는 오류');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    fetchHealth();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMessage = { id: Date.now(), author: 'You', text };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      setSending(true);

      const response = await fetch(`${apiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'PM Agent',
          message: text,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || `AI 요청 실패: ${response.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          author: 'PM Agent',
          text: json.answer || '(응답 없음)',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          author: 'System',
          text: `AI 연결 오류: ${err.message || 'unknown error'}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="app-shell">
      <aside className="panel left">
        <h2>Preset Teams</h2>
        <ul className="list">
          {presetTeams.map((team) => (
            <li key={team}>{team}</li>
          ))}
        </ul>
      </aside>

      <section className="panel center">
        <header className="topbar">
          <div>
            <h1>Super Individual Workspace</h1>
            <p>
              API: <code>{apiBaseUrl}</code>
            </p>
          </div>
          <span className={`badge ${error ? 'bad' : 'good'}`}>{connectionLabel}</span>
        </header>

        <div className="chat-box">
          {messages.map((msg) => (
            <div className="msg" key={msg.id}>
              <strong>{msg.author}</strong>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="@Researcher 경쟁사 비교표 만들어줘"
          />
          <button onClick={handleSend}>전송</button>
        </div>

        {!loading && error && (
          <div className="error">
            <strong>연결 오류:</strong> {error}
          </div>
        )}
      </section>

      <aside className="panel right">
        <h2>Run Status</h2>
        <ul className="list">
          {initialTasks.map((task) => (
            <li key={task.id}>
              <div>{task.title}</div>
              <small>
                {task.assignee} · {task.status}
              </small>
            </li>
          ))}
        </ul>

        {!loading && data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </aside>
    </main>
  );
}

export default App;
