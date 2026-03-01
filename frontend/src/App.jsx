import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT_MS = 15000;

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

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

  return (
    <main className="container">
      <h1>React + Express + Supabase Starter</h1>
      <p>
        API Base URL: <code>{apiBaseUrl}</code>
      </p>

      {loading && <p>백엔드 상태 확인 중...</p>}

      {!loading && error && (
        <div className="error">
          <strong>연결 오류:</strong> {error}
        </div>
      )}

      {!loading && data && (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </main>
  );
}

export default App;
