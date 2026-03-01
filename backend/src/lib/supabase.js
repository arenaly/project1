import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const supabaseAuthMode = supabaseServiceRoleKey
  ? 'service_role'
  : supabaseAnonKey
    ? 'anon'
    : 'none';

export async function checkSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      reason: 'missing_env',
      message: 'SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.',
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    return {
      ok: response.ok,
      reason: response.ok ? 'connected' : 'api_error',
      status: response.status,
      statusText: response.statusText,
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'network_error',
      message: error?.message || 'Supabase 연결 중 네트워크 오류가 발생했습니다.',
    };
  }
}
