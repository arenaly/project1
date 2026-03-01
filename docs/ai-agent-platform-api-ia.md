# AaaS MVP API & 화면 IA 초안

## 1) REST API 초안

Base URL: `/api/v1`

### Team Templates
- `GET /templates`
- `GET /templates/:id`

### Teams
- `POST /teams`
  - body: `{ templateId, name }`
- `GET /teams`
- `GET /teams/:id`

### Agents
- `GET /teams/:id/agents`
- `PATCH /agents/:agentId`
  - 역할, 페르소나, 도구권한 수정

### Runs (실행)
- `POST /runs`
  - body: `{ teamId, globalGoal, constraints }`
- `GET /runs/:runId`
- `POST /runs/:runId/pause`
- `POST /runs/:runId/resume`
- `POST /runs/:runId/stop`

### Tasks
- `GET /runs/:runId/tasks`
- `PATCH /tasks/:taskId`
  - 수동 재할당, 우선순위 조정

### Messages / Logs
- `GET /runs/:runId/messages`
- `GET /runs/:runId/metrics`
- `POST /runs/:runId/messages`
  - body: `{ text, mentionTargets: ["agent:researcher", "team:marketing"] }`

### Approvals
- `GET /runs/:runId/approvals`
- `POST /approvals/:approvalId/approve`
- `POST /approvals/:approvalId/reject`

### Preset Onboarding
- `GET /presets`
- `POST /presets/:presetId/create-team`
  - body: `{ teamName, goal }`

---

## 2) 이벤트(WebSocket/SSE) 초안

채널: `run:{runId}`

이벤트 타입:
- `run.started`
- `task.started` / `task.completed` / `task.failed`
- `approval.requested` / `approval.resolved`
- `guardrail.triggered`
- `run.completed` / `run.failed` / `run.stopped`
- `chat.mention.routed`
- `chat.agent.replied`

---

## 3) 화면 IA (정보구조)

1. **Auth**
   - 로그인

2. **Dashboard**
   - 활성 팀
   - 최근 실행
   - 월 사용량/비용

3. **Templates**
   - 템플릿 목록
   - 템플릿 상세(역할/토폴로지/가드레일)

4. **Teams**
   - 팀 생성(템플릿 선택)
   - 팀 상세(에이전트 구성, 권한)

5. **Run Studio**
   - Global Goal 입력
   - 제약조건(시간/턴/비용)
   - 실행 시작

6. **Run Monitor**
   - DAG/칸반형 Task 상태
   - 에이전트 대화 로그
   - 현재 비용/토큰
   - 가드레일 이벤트

6-1. **Team Chat (단톡방)**
   - 사용자/에이전트 공용 대화방
   - `@agent`, `@team`, `@all` 멘션 기반 지시
   - 작업 생성/진행/완료 알림이 같은 채널에서 표시

7. **Approval Inbox**
   - 승인 요청 목록
   - 승인/반려 + 코멘트

8. **Reports**
   - 실행 결과/품질/비용 리포트

---

## 4) MVP 화면 우선순위

P0
- Preset 선택 화면(원클릭 팀 생성)
- Templates
- Teams
- Run Studio
- Run Monitor
- Team Chat
- Approval Inbox

P1
- Reports 고도화
- 템플릿 편집기(고급)
