# AaaS MVP 데이터 모델 (Supabase/PostgreSQL)

## 1) 핵심 엔터티

- tenants: 고객 조직(회사)
- users: 사용자(운영자/승인자)
- team_templates: 팀 블루프린트 템플릿
- teams: 실제 생성된 팀 인스턴스
- agents: 팀 내 에이전트 정의
- runs: 목표 실행 단위(한 번의 프로젝트 실행)
- tasks: 실행 중 생성되는 로컬 태스크
- messages: 에이전트 간 메시지 로그
- approvals: 인간 승인 단계 기록
- tool_calls: 외부 도구/API 사용 기록
- usage_metrics: 토큰/비용 집계

---

## 2) 권장 테이블 스키마 (요약)

### tenants
- id (uuid, pk)
- name (text)
- plan_tier (text)
- created_at (timestamptz)

### users
- id (uuid, pk)
- tenant_id (uuid, fk -> tenants.id)
- email (text, unique)
- role (text: owner/admin/member/approver)
- created_at

### team_templates
- id (uuid, pk)
- tenant_id (uuid nullable, null이면 글로벌 템플릿)
- name (text)
- domain (text: marketing/dev/strategy)
- topology (jsonb)
- guardrails (jsonb)
- created_at

### teams
- id (uuid, pk)
- tenant_id (uuid, fk)
- template_id (uuid, fk)
- name (text)
- status (text: active/archived)
- created_by (uuid, fk -> users.id)
- created_at

### agents
- id (uuid, pk)
- team_id (uuid, fk)
- name (text)
- role (text)
- persona (text)
- tool_policy (jsonb)
- output_schema (jsonb)
- rank_order (int)

### runs
- id (uuid, pk)
- team_id (uuid, fk)
- initiated_by (uuid, fk -> users.id)
- global_goal (text)
- topology_mode (text)
- state (text: queued/running/paused/completed/failed/stopped)
- max_turns (int)
- max_duration_sec (int)
- max_budget_usd (numeric)
- started_at, ended_at

### tasks
- id (uuid, pk)
- run_id (uuid, fk)
- agent_id (uuid, fk)
- title (text)
- description (text)
- status (text: queued/running/blocked/done/failed)
- depends_on_task_id (uuid nullable, self fk)
- output (jsonb)
- created_at, updated_at

### messages
- id (uuid, pk)
- run_id (uuid, fk)
- task_id (uuid nullable, fk)
- sender_agent_id (uuid nullable, fk)
- recipient_agent_id (uuid nullable, fk)
- direction (text: horizontal/upward/downward/human)
- content (text)
- metadata (jsonb)
- created_at

### approvals
- id (uuid, pk)
- run_id (uuid, fk)
- task_id (uuid nullable, fk)
- requested_by_agent_id (uuid, fk)
- approver_user_id (uuid, fk)
- status (text: pending/approved/rejected)
- note (text)
- acted_at

### usage_metrics
- id (uuid, pk)
- run_id (uuid, fk)
- agent_id (uuid nullable, fk)
- model_name (text)
- prompt_tokens (int)
- completion_tokens (int)
- total_tokens (int)
- estimated_cost_usd (numeric)
- created_at

---

## 3) 인덱스 권장
- runs(team_id, created_at desc)
- tasks(run_id, status)
- messages(run_id, created_at)
- approvals(run_id, status)
- usage_metrics(run_id, created_at)

---

## 4) RLS(행 수준 보안) 기본 원칙
- 모든 비관리 테이블에 `tenant_id` 기반 접근 제어
- 사용자는 자신의 tenant 데이터만 읽기/쓰기
- 감사 로그(messages/usage_metrics)는 삭제 제한(soft delete 권장)
