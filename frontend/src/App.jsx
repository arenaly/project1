import { useEffect, useState } from 'react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/health`);
        if (!response.ok) {
          throw new Error(`요청 실패: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message || '알 수 없는 오류');
      } finally {
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
