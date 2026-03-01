import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import {
  isSupabaseConfigured,
  supabase,
  supabaseAuthMode,
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

const LOCAL_PRESETS = [
  {
    id: 'marketing-avengers',
    name: '마케팅 어벤져스 팀',
    domain: 'marketing',
    description: '트렌드 분석 + 카피 + 검수 자동 루프',
  },
  {
    id: 'research-squad',
    name: '신사업 리서치 팀',
    domain: 'strategy',
    description: '시장/경쟁사 분석 + 임원 보고서 초안',
  },
  {
    id: 'localization-squad',
    name: '번역/로컬라이징 팀',
    domain: 'operations',
    description: '다국어 번역 + 톤앤매너 교정',
  },
];

function buildInitialTasks(goal) {
  return [
    {
      title: '목표 분석 및 계획 수립',
      description: `Global Goal 분석: ${goal}`,
      status: 'queued',
      assignee_label: 'PM Agent',
    },
    {
      title: '리서치 자료 수집',
      description: '필요한 데이터/레퍼런스 수집',
      status: 'queued',
      assignee_label: 'Researcher',
    },
    {
      title: '초안 작성',
      description: '산출물 초안 작성',
      status: 'queued',
      assignee_label: 'Copywriter',
    },
  ];
}

function extractMentions(text) {
  const matches = text.match(/@([\w가-힣-]+)/g) || [];
  return matches.map((match) => match.replace('@', ''));
}

async function generateAiReply(message, role = 'PM Agent') {
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!apiKey) {
    return {
      ok: false,
      status: 400,
      error: 'OPENAI_API_KEY 또는 GROQ_API_KEY가 설정되지 않았습니다.',
    };
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
      return {
        ok: false,
        status: 502,
        error: 'AI API 호출 실패',
        detail: json,
      };
    }

    return {
      ok: true,
      model,
      answer: json?.choices?.[0]?.message?.content?.trim() || '(응답 없음)',
      usage: json?.usage || null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: 'AI API 네트워크 오류',
      detail: error?.message || 'unknown_error',
    };
  }
}

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
      authMode: supabaseAuthMode,
      connection: supabaseConnection,
    },
  });
});

app.get('/api/presets', async (_req, res) => {
  if (!supabase) {
    return res.json({
      ok: true,
      source: 'local',
      presets: LOCAL_PRESETS,
    });
  }

  try {
    const { data, error } = await supabase
      .from('team_templates')
      .select('id,name,domain,description')
      .eq('is_preset', true)
      .limit(30);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return res.json({
        ok: true,
        source: 'local-fallback',
        presets: LOCAL_PRESETS,
      });
    }

    return res.json({
      ok: true,
      source: 'supabase',
      presets: data,
    });
  } catch (error) {
    return res.json({
      ok: true,
      source: 'local-fallback',
      warning: error?.message || 'preset 조회 실패',
      presets: LOCAL_PRESETS,
    });
  }
});

app.post('/api/presets/:presetId/create-team', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase가 설정되지 않았습니다.',
    });
  }

  const { presetId } = req.params;
  const {
    teamName,
    goal = '초기 목표가 설정되지 않았습니다.',
    initiatedBy = 'demo-user',
  } = req.body || {};

  if (!teamName || typeof teamName !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'teamName 문자열이 필요합니다.',
    });
  }

  try {
    const { data: teamRow, error: teamError } = await supabase
      .from('teams')
      .insert([
        {
          tenant_id: null,
          template_id: null,
          name: teamName,
          status: 'active',
          created_by: initiatedBy,
          metadata: { presetId },
        },
      ])
      .select('id,name,status')
      .single();

    if (teamError) {
      throw teamError;
    }

    const { data: runRow, error: runError } = await supabase
      .from('runs')
      .insert([
        {
          team_id: teamRow.id,
          initiated_by: initiatedBy,
          global_goal: goal,
          topology_mode: 'review-loop',
          state: 'queued',
          max_turns: 12,
          max_duration_sec: 900,
          max_budget_usd: 2,
        },
      ])
      .select('id,state,global_goal')
      .single();

    if (runError) {
      throw runError;
    }

    const initialTasks = buildInitialTasks(goal).map((task) => ({
      run_id: runRow.id,
      ...task,
    }));

    const { error: taskError } = await supabase.from('tasks').insert(initialTasks);
    if (taskError) {
      throw taskError;
    }

    return res.status(201).json({
      ok: true,
      presetId,
      team: teamRow,
      run: runRow,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'preset 기반 팀 생성 실패',
      detail: error?.message || 'unknown_error',
    });
  }
});

app.post('/api/runs', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ ok: false, error: 'Supabase가 설정되지 않았습니다.' });
  }

  const {
    teamId,
    globalGoal,
    initiatedBy = 'demo-user',
    constraints = {},
  } = req.body || {};

  if (!teamId || !globalGoal) {
    return res.status(400).json({
      ok: false,
      error: 'teamId, globalGoal이 필요합니다.',
    });
  }

  try {
    const { data: runRow, error } = await supabase
      .from('runs')
      .insert([
        {
          team_id: teamId,
          initiated_by: initiatedBy,
          global_goal: globalGoal,
          topology_mode: 'review-loop',
          state: 'queued',
          max_turns: constraints.maxTurns ?? 12,
          max_duration_sec: constraints.maxDurationSec ?? 900,
          max_budget_usd: constraints.maxBudgetUsd ?? 2,
        },
      ])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const initialTasks = buildInitialTasks(globalGoal).map((task) => ({
      run_id: runRow.id,
      ...task,
    }));

    await supabase.from('tasks').insert(initialTasks);

    return res.status(201).json({ ok: true, run: runRow });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'run 생성 실패',
      detail: error?.message || 'unknown_error',
    });
  }
});

app.get('/api/runs/:runId', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ ok: false, error: 'Supabase가 설정되지 않았습니다.' });
  }

  const { runId } = req.params;

  try {
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError) {
      throw runError;
    }

    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (taskError) {
      throw taskError;
    }

    return res.json({ ok: true, run, tasks });
  } catch (error) {
    return res.status(404).json({
      ok: false,
      error: 'run 조회 실패',
      detail: error?.message || 'unknown_error',
    });
  }
});

app.get('/api/runs/:runId/tasks', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ ok: false, error: 'Supabase가 설정되지 않았습니다.' });
  }

  const { runId } = req.params;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return res.json({ ok: true, tasks: data || [] });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'tasks 조회 실패',
      detail: error?.message || 'unknown_error',
    });
  }
});

app.post('/api/runs/:runId/messages', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ ok: false, error: 'Supabase가 설정되지 않았습니다.' });
  }

  const { runId } = req.params;
  const { text, sender = 'human' } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'text 문자열이 필요합니다.',
    });
  }

  try {
    const { data: userMessage, error: msgError } = await supabase
      .from('messages')
      .insert([
        {
          run_id: runId,
          direction: 'human',
          sender_label: sender,
          content: text,
          metadata: { source: 'chat' },
        },
      ])
      .select('*')
      .single();

    if (msgError) {
      throw msgError;
    }

    const ai = await generateAiReply(text, 'PM Agent');
    if (!ai.ok) {
      return res.status(ai.status || 500).json(ai);
    }

    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('messages')
      .insert([
        {
          run_id: runId,
          direction: 'downward',
          sender_label: 'PM Agent',
          content: ai.answer,
          metadata: { model: ai.model, usage: ai.usage },
        },
      ])
      .select('*')
      .single();

    if (aiMsgError) {
      throw aiMsgError;
    }

    const mentions = extractMentions(text);
    let createdTask = null;

    if (mentions.length > 0) {
      const { data: taskRow } = await supabase
        .from('tasks')
        .insert([
          {
            run_id: runId,
            title: `@${mentions[0]} 지시 작업`,
            description: text,
            status: 'queued',
            assignee_label: mentions[0],
            source_message_id: userMessage.id,
          },
        ])
        .select('*')
        .single();

      createdTask = taskRow;
    }

    return res.status(201).json({
      ok: true,
      userMessage,
      aiMessage,
      ai,
      createdTask,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'message 처리 실패',
      detail: error?.message || 'unknown_error',
    });
  }
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

  const ai = await generateAiReply(message, role);
  return res.status(ai.ok ? 200 : ai.status || 500).json(ai);
});

app.get('/api/ai/config-check', (_req, res) => {
  const openAiKey = process.env.OPENAI_API_KEY || '';
  const groqKey = process.env.GROQ_API_KEY || '';

  res.json({
    ok: true,
    ai: {
      hasOpenAiKey: Boolean(openAiKey),
      hasGroqKey: Boolean(groqKey),
      using: openAiKey ? 'OPENAI_API_KEY' : groqKey ? 'GROQ_API_KEY' : null,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      keyLength: (openAiKey || groqKey).length,
    },
  });
});

app.get('/', (_req, res) => {
  res.send('Backend is running. Try GET /api/health');
});

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
