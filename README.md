# Fullstack Starter (React + Express + Supabase)

무료 서비스(Vercel / Render / Supabase) 중심으로 빠르게 배포 가능한 기본 템플릿입니다.

## 1) 프로젝트 구조

```bash
.
├── backend/              # Express API 서버 (Render 배포 대상)
├── frontend/             # React + Vite 앱 (Vercel 배포 대상)
└── docs/
    ├── deployment-free-tier.md
    └── ops-checklist.md
```

## 2) 로컬 실행

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

기본 실행 주소: `http://localhost:4000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

기본 실행 주소: `http://localhost:5173`

## 3) 주요 엔드포인트

- `GET /api/health`
  - 서버 상태 확인
  - Supabase 환경변수 설정 여부도 함께 반환

응답 예시:

```json
{
  "ok": true,
  "service": "backend",
  "timestamp": "2026-03-01T12:00:00.000Z",
  "supabase": {
    "configured": false
  }
}
```

## 4) 배포 가이드

아래 문서를 순서대로 따라가면 무료 플랜 기준으로 배포 가능합니다.

- `docs/deployment-free-tier.md` : Supabase + Render + Vercel 상세 셋업
- `docs/ops-checklist.md` : CI/CD, 운영 체크리스트, 무료 플랜 주의사항

## 5) 권장 배포 순서

1. Supabase 프로젝트 생성 및 키 준비
2. Render에 backend 배포
3. Vercel에 frontend 배포
4. 배포 도메인 기준으로 CORS/환경변수 재확인
