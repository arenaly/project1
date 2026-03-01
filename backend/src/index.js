import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { isSupabaseConfigured } from './lib/supabase.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'backend',
    timestamp: new Date().toISOString(),
    supabase: {
      configured: isSupabaseConfigured,
    },
  });
});

app.get('/', (_req, res) => {
  res.send('Backend is running. Try GET /api/health');
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
