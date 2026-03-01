import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import {
  isSupabaseConfigured,
  checkSupabaseConnection,
} from './lib/supabase.js';

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

app.get('/api/health', async (_req, res) => {
  const supabaseConnection = await checkSupabaseConnection();

  res.json({
    ok: true,
    service: 'backend',
    timestamp: new Date().toISOString(),
    supabase: {
      configured: isSupabaseConfigured,
      connection: supabaseConnection,
    },
  });
});

app.get('/api/supabase/check', async (_req, res) => {
  const connection = await checkSupabaseConnection();

  const statusCode = connection.ok
    ? 200
    : connection.reason === 'missing_env'
      ? 400
      : 502;

  res.status(statusCode).json({
    ok: connection.ok,
    supabase: connection,
  });
});

app.post('/api/ai/chat', async (req, res) => {
  const { message, role = 'PM Agent' } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'message 문자열이 필요합니다.',
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    return res.status(400).json({
      ok: false,
      error: 'OPENAI_API_KEY가 설정되지 않았습니다.',
    });
  }

  try {
    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              '너는 멀티 에이전트 팀의 실무 보조 AI다. 사용자의 지시를 실행 가능한 다음 단계로 정리하고, 짧고 명확하게 답해라.',
          },
          {
            role: 'user',
            content: `[${role}] ${message}`,
          },
        ],
      }),
    });

    const json = await aiResponse.json();

    if (!aiResponse.ok) {
      return res.status(502).json({
        ok: false,
        error: 'AI API 호출 실패',
        detail: json,
      });
    }

    const answer = json?.choices?.[0]?.message?.content?.trim();

    return res.json({
      ok: true,
      model,
      answer: answer || '(응답 없음)',
      usage: json?.usage || null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'AI API 네트워크 오류',
      detail: error?.message || 'unknown_error',
    });
  }
});

app.get('/', (_req, res) => {
  res.send('Backend is running. Try GET /api/health');
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
