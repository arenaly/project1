import React, { useEffect, useState } from 'react';

function App() {
  const [healthInfo, setHealthInfo] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/health')
      .then(res => res.json())
      .then(data => setHealthInfo(data))
      .catch(err => console.error('Error fetching health:', err));
  }, []);

  return (
    <div className="container">
      <h1>Fullstack Starter</h1>
      <p>React + Express + Supabase Boilerplate</p>

      <div className="card">
        <h2>Backend API Status</h2>
        {healthInfo ? (
          <pre>{JSON.stringify(healthInfo, null, 2)}</pre>
        ) : (
          <p>Loading API status...</p>
        )}
      </div>
    </div>
  );
}

export default App;