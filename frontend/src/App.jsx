import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const REQUEST_TIMEOUT_MS = 15000;

const presetTeams = [
  {
    name: '마케팅 어벤져스 팀',
    description: '트렌드 분석 + 카피 + 검수 자동 루프',
    badge: 'Popular',
  },
  {
    name: '신사업 리서치 팀',
    description: '시장/경쟁사 분석 + 임원 보고서 초안',
    badge: 'Pro',
  },
  {
    name: '번역/로컬라이징 팀',
    description: '다국어 번역 + 톤앤매너 교정',
    badge: 'New',
  },
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

const initialRelaySteps = [
  { key: 'pm', label: 'PM Agent', role: '요구사항 분해', status: 'idle' },
  { key: 'researcher', label: 'Researcher', role: '근거/데이터 수집', status: 'idle' },
  { key: 'writer', label: 'Copywriter', role: '초안 생성', status: 'idle' },
  { key: 'reviewer', label: 'Reviewer', role: '검수/승인요청', status: 'idle' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTeam, setActiveTeam] = useState(presetTeams[0].name);
  const [relaySteps, setRelaySteps] = useState(initialRelaySteps);

  const connectionLabel = loading
    ? '백엔드 확인 중'
    : error
      ? '연결 실패'
      : '연결 정상';

  const runTasks = relaySteps.map((step, idx) => ({
    id: idx + 1,
    title: step.role,
    assignee: step.label,
    status:
      step.status === 'done'
        ? 'done'
        : step.status === 'running'
          ? 'running'
          : step.status === 'waiting'
            ? 'queued'
            : 'blocked',
  }));

  const updateRelayStatus = (targetKey, status) => {
    setRelaySteps((prev) =>
      prev.map((step) =>
        step.key === targetKey
          ? { ...step, status }
          : status === 'running' && step.status === 'running'
            ? { ...step, status: 'done' }
            : step
      )
    );
  };

  const resetRelay = () => {
    setRelaySteps((prev) =>
      prev.map((step, index) => ({
        ...step,
        status: index === 0 ? 'running' : 'waiting',
      }))
    );
  };

  const simulateRelay = async (seedText, aiAnswer) => {
    updateRelayStatus('pm', 'done');
    await sleep(320);
    updateRelayStatus('researcher', 'running');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 2,
        author: 'Researcher',
        text: `요청("${seedText.slice(0, 26)}...") 관련 근거를 수집해 PM에게 전달했습니다.`,
      },
    ]);

    await sleep(360);
    updateRelayStatus('writer', 'running');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 3,
        author: 'Copywriter',
        text: '리서치 결과를 바탕으로 초안 1차 버전을 작성했습니다.',
      },
    ]);

    await sleep(360);
    updateRelayStatus('reviewer', 'running');
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 4,
        author: 'Reviewer',
        text: `품질 체크 완료. 최종 제안: ${aiAnswer.slice(0, 80)}...`,
      },
    ]);

    await sleep(260);
    setRelaySteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));
  };

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
    resetRelay();

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

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const bodyText = await response.text();
        const preview = bodyText.slice(0, 120).replace(/\s+/g, ' ');
        throw new Error(
          `AI API가 JSON이 아닌 응답을 반환했습니다. API URL 확인 필요 (현재: ${apiBaseUrl}) / 미리보기: ${preview}`
        );
      }

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

      await simulateRelay(text, json.answer || '응답 없음');
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          author: 'System',
          text: `AI 연결 오류: ${err.message || 'unknown error'}`,
        },
      ]);
      setRelaySteps((prev) => prev.map((step) => ({ ...step, status: 'idle' })));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="app-shell">
      <aside className="panel left glass">
        <div className="section-head">
          <h2>Preset Teams</h2>
          <span className="muted">3개 템플릿</span>
        </div>

        <div className="team-stack">
          {presetTeams.map((team) => (
            <button
              type="button"
              key={team.name}
              className={`team-card ${activeTeam === team.name ? 'active' : ''}`}
              onClick={() => setActiveTeam(team.name)}
            >
              <div className="row-between">
                <strong>{team.name}</strong>
                <span className="tag">{team.badge}</span>
              </div>
              <p>{team.description}</p>
            </button>
          ))}
        </div>

        <div className="mini-stat">
          <span>이번 주 자동화 절감 시간</span>
          <strong>12.4h</strong>
        </div>
      </aside>

      <section className="panel center glass">
        <header className="topbar modern">
          <div>
            <h1>Super Individual Workspace</h1>
            <p>
              활성 팀: <b>{activeTeam}</b>
            </p>
          </div>
          <div className="status-wrap">
            <span className={`badge ${error ? 'bad' : 'good'}`}>{connectionLabel}</span>
            <span className="muted tiny">
              API <code>{apiBaseUrl}</code>
            </span>
          </div>
        </header>

        <div className="quick-actions">
          <button type="button" onClick={() => setInput('@Researcher 시장 리서치')}>@Researcher 시장 리서치</button>
          <button type="button" onClick={() => setInput('@Copywriter 카피 3안 생성')}>@Copywriter 카피 3안 생성</button>
          <button type="button" onClick={() => setInput('@Reviewer 검수 체크')}>@Reviewer 검수 체크</button>
        </div>

        <div className="relay-board">
          {relaySteps.map((step, idx) => (
            <div key={step.key} className="relay-item">
              <div className={`agent-dot ${step.status}`} />
              <div>
                <strong>{step.label}</strong>
                <p>{step.role}</p>
              </div>
              <span className={`status-pill ${step.status}`}>{step.status}</span>
              {idx < relaySteps.length - 1 && <span className="handoff">→</span>}
            </div>
          ))}
        </div>

        <div className="chat-box modern-chat">
          {messages.map((msg) => (
            <div className={`msg ${msg.author === 'You' ? 'mine' : ''}`} key={msg.id}>
              <div className="msg-head">
                <strong>{msg.author}</strong>
              </div>
              <p>{msg.text}</p>
            </div>
          ))}
          {sending && (
            <div className="msg">
              <div className="msg-head">
                <strong>PM Agent</strong>
              </div>
              <p>응답 생성 중...</p>
            </div>
          )}
        </div>

        <div className="chat-input sticky">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="@Researcher 경쟁사 비교표 만들어줘"
          />
          <button onClick={handleSend} disabled={sending}>
            {sending ? '전송 중...' : '전송'}
          </button>
        </div>

        {!loading && error && (
          <div className="error">
            <strong>연결 오류:</strong> {error}
          </div>
        )}
      </section>

      <aside className="panel right glass">
        <div className="section-head">
          <h2>Run Status</h2>
          <span className="muted">Live</span>
        </div>

        <ul className="list modern-list">
          {runTasks.map((task) => (
            <li key={task.id}>
              <div className="row-between">
                <div>{task.title}</div>
                <span className={`chip ${task.status}`}>{task.status}</span>
              </div>
              <small>{task.assignee}</small>
            </li>
          ))}
        </ul>

        {!loading && data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </aside>
    </main>
  );
}

export default App;
