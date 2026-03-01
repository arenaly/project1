# 무료 배포 가이드 (Vercel + Render + Supabase)

이 문서는 아래 조합 기준으로 작성되었습니다.

- Frontend: React + Vite → **Vercel (Free)**
- Backend: Node + Express → **Render Web Service (Free)**
- Database: PostgreSQL → **Supabase (Free)**

---

## 0) 가입/초기 설정 빠른 체크리스트

아래 순서대로 진행하면 가장 빠릅니다.

- [ ] GitHub 저장소 준비 (이미 완료)
- [ ] Supabase 가입 및 새 프로젝트 생성
- [ ] Supabase `Project URL`, `anon key` 복사
- [ ] Render 가입 후 GitHub 연동
- [ ] Render에 backend 서비스 생성 (`Root Directory: backend`)
- [ ] Render 환경변수 등록 (`PORT`, `FRONTEND_ORIGIN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- [ ] Vercel 가입 후 GitHub 연동
- [ ] Vercel에 frontend 프로젝트 생성 (`Root Directory: frontend`)
- [ ] Vercel 환경변수 등록 (`VITE_API_BASE_URL=Render 백엔드 URL`)
- [ ] Vercel 도메인 확정 후 Render `FRONTEND_ORIGIN` 최종 업데이트
- [ ] 최종 점검: 프론트 접속 → 백엔드 health JSON 확인

---

## 1) Supabase 준비

1. [https://supabase.com](https://supabase.com) 가입 후 새 프로젝트 생성
2. 프로젝트 Settings → API에서 아래 값 복사
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`

> 현재 템플릿은 health check만 포함되어 있어 DB 테이블 생성은 필수가 아닙니다.

---

## 2) Backend를 Render에 배포

1. [https://render.com](https://render.com) 가입 후 GitHub 연결
2. **New + → Web Service** 선택 후 이 저장소 연결
3. 설정
   - Name: `project1-backend` (원하는 이름)
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Environment Variables 등록
   - `PORT` = `10000` (Render에서 일반적으로 10000 사용)
   - `FRONTEND_ORIGIN` = (나중에 Vercel 도메인 넣기, 초기엔 임시값 가능)
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_ANON_KEY` = Supabase anon key
5. Deploy 실행

배포 후 백엔드 URL 예시:

`https://project1-backend.onrender.com`

헬스체크 확인:

`https://project1-backend.onrender.com/api/health`

---

## 3) Frontend를 Vercel에 배포

1. [https://vercel.com](https://vercel.com) 가입 후 GitHub 연결
2. **Add New → Project** 에서 저장소 Import
3. 설정
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables 등록
   - `VITE_API_BASE_URL` = Render 백엔드 URL (예: `https://project1-backend.onrender.com`)
5. Deploy 실행

배포 후 프론트 URL 예시:

`https://project1-frontend.vercel.app`

---

## 4) CORS 최종 연결

Vercel 도메인이 확정되면 Render 환경변수 `FRONTEND_ORIGIN`을 아래처럼 업데이트합니다.

- `FRONTEND_ORIGIN=https://project1-frontend.vercel.app`

Render에서 재배포 후, 프론트에서 health 응답이 정상 표시되는지 확인하세요.

---

## 5) 로컬/운영 환경변수 정리

### backend/.env

```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:4000
```

운영에서는 각 플랫폼(Vercel, Render)의 대시보드 환경변수를 사용하고, `.env` 파일은 커밋하지 않습니다.
