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
