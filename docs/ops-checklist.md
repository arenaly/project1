# 운영 체크리스트 (무료 플랜 기준)

## 1) CI/CD 기본 흐름

- `main` 브랜치에 push
  - GitHub Actions CI 실행 (frontend build + backend import check)
  - Vercel: frontend 자동 배포
  - Render: backend 자동 배포

> 배포 실패 시, 플랫폼 로그(Vercel Deploy Log / Render Logs) 먼저 확인하세요.

---

## 2) 배포 전 체크리스트

- [ ] `backend` 환경변수 설정 완료
  - [ ] `PORT`
  - [ ] `FRONTEND_ORIGIN`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
- [ ] `frontend` 환경변수 설정 완료
  - [ ] `VITE_API_BASE_URL`
- [ ] `FRONTEND_ORIGIN` 값이 실제 Vercel 도메인과 일치
- [ ] `/api/health` 응답 확인
- [ ] 프론트에서 health JSON 정상 렌더링 확인

---

## 3) 장애 발생 시 1차 점검

1. **CORS 오류**
   - Render `FRONTEND_ORIGIN`이 실제 프론트 도메인과 동일한지 확인
2. **프론트에서 API 호출 실패**
   - Vercel `VITE_API_BASE_URL` 값 확인
3. **백엔드 500 오류**
   - Render 로그에서 환경변수 누락 여부 확인
4. **Supabase 연결 문제**
   - URL/KEY 오타, 키 재발급 여부 확인

---

## 4) 무료 플랜 주의사항

### Render Free
- 일정 시간 트래픽이 없으면 슬립(sleep) 발생
- 첫 요청이 느릴 수 있음(cold start)

### Supabase Free
- 프로젝트/DB 사용량 제한 존재
- 장기 미사용 시 프로젝트 pause 정책을 확인해야 함

### Vercel Hobby
- 개인 프로젝트/비상업적 사용에 적합
- 팀 기능/고급 기능은 플랜 제한 가능

---

## 5) 추천 운영 습관

- 배포 환경변수 변경 시 README 또는 docs에 즉시 반영
- 중요한 키는 정기적으로 rotate
- 모니터링용 헬스체크 URL을 즐겨찾기에 등록
- 장애 재발 방지를 위해 "원인 / 조치 / 재발방지"를 짧게 기록

---

## 6) Multiagent 운영 체크 (검토게이트 + 인계카드)

- [ ] 인계카드 생성 규칙 확인
  - [ ] 최소 필드(요약/근거/산출물/다음 담당자) 누락률 점검
  - [ ] 상태 전이(`handoff → in_review → approved/rejected`) 무결성 확인
- [ ] 검토게이트 SLA 확인
  - [ ] 평균 승인 대기시간(MTTA) 점검
  - [ ] 반려 사유(note) 기록률 점검
- [ ] 재작업 라우팅 정상 동작
  - [ ] 반려 시 이전 담당자로 재할당 이벤트 기록
  - [ ] 승인 시 run 완료 또는 다음 단계 전환 확인
- [ ] Trace/Event 타임라인 점검
  - [ ] `approval.requested`, `approval.resolved`, `handoff.created`, `task.reassigned` 이벤트 누락 여부
  - [ ] 최근 50개 이벤트 조회 API 정상 응답
- [ ] 런타임 제어 점검
  - [ ] `pause/resume/stop/retry/reassign` API 호출 결과와 run state 일치
- [ ] 정책/가드레일 점검
  - [ ] 루프/타임아웃/비용 초과 시 policy event 생성 여부
