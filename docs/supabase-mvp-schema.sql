-- AaaS MVP minimal schema
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists team_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text not null default 'marketing',
  description text,
  topology jsonb default '{}'::jsonb,
  guardrails jsonb default '{}'::jsonb,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  template_id uuid references team_templates(id) on delete set null,
  name text not null,
  status text not null default 'active',
  created_by text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  initiated_by text,
  global_goal text not null,
  topology_mode text not null default 'review-loop',
  state text not null default 'queued',
  max_turns int not null default 12,
  max_duration_sec int not null default 900,
  max_budget_usd numeric(10,2) not null default 2,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'queued',
  assignee_label text,
  source_message_id uuid,
  output jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references runs(id) on delete cascade,
  direction text not null default 'horizontal',
  sender_label text,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_team_templates_preset on team_templates(is_preset, created_at desc);
create index if not exists idx_runs_team_created_at on runs(team_id, created_at desc);
create index if not exists idx_tasks_run_status on tasks(run_id, status);
create index if not exists idx_messages_run_created_at on messages(run_id, created_at);

insert into team_templates (name, domain, description, is_preset)
values
  ('마케팅 어벤져스 팀', 'marketing', '트렌드 분석 + 카피 + 검수 자동 루프', true),
  ('신사업 리서치 팀', 'strategy', '시장/경쟁사 분석 + 임원 보고서 초안', true),
  ('번역/로컬라이징 팀', 'operations', '다국어 번역 + 톤앤매너 교정', true)
on conflict do nothing;
