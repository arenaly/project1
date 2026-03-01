import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { isSupabaseConfigured } from './lib/supabase.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const originEnv =
  process.env.FRONTEND_ORIGINS ||
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:5173';

const allowedOrigins = originEnv
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowVercelAppOrigins =
  String(process.env.ALLOW_VERCEL_APP_ORIGINS ?? 'true').toLowerCase() ===
  'true';

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (allowVercelAppOrigins && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
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
