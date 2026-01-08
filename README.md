# CMS Project

범용 CMS(Content Management System) 플랫폼

## 프로젝트 개요

"빈 도화지" 같은 CMS를 목표로 합니다.
초기 상태에서는 아무런 콘텐츠 타입이나 페이지가 정의되어 있지 않으며,
사용자가 자신의 목적에 맞게 자유롭게 구조를 설계하고 커스터마이징할 수 있습니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | NestJS, Prisma, PostgreSQL |
| **프론트엔드** | React, TypeScript, Vite |
| **패키지 매니저** | pnpm (모노레포) |

## 프로젝트 구조

```
cms-project/
├── backend/              # NestJS 백엔드
├── frontend/
│   └── packages/
│       ├── admin/        # Admin Panel (React)
│       ├── public/       # Public Site (React)
│       └── shared/       # 프론트엔드 공유 코드
├── packages/
│   └── types/            # 백엔드-프론트엔드 공유 타입
├── uploads/              # 업로드 파일 저장소
├── docs/                 # 문서
└── rules/                # 프로젝트 규칙 문서
```

## 시작하기

### 요구사항

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL

### 설치

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 설정값 수정
```

### 개발 서버 실행

```bash
# 백엔드 개발 서버
pnpm dev:backend

# Admin Panel 개발 서버
pnpm dev:admin

# Public Site 개발 서버
pnpm dev:public
```

### 빌드

```bash
# 백엔드 빌드
pnpm build:backend

# Admin Panel 빌드
pnpm build:admin

# Public Site 빌드
pnpm build:public
```

## 문서

자세한 내용은 `rules/` 폴더의 문서들을 참고하세요.

| 문서 | 설명 |
|------|------|
| [project.md](rules/project.md) | 프로젝트 기획 |
| [glossary.md](rules/glossary.md) | 용어 정의 |
| [scenarios.md](rules/scenarios.md) | 사용자 시나리오 |
| [backend.md](rules/backend.md) | 백엔드 기술 명세 |
| [frontend.md](rules/frontend.md) | 프론트엔드 기술 명세 |
| [structure.md](rules/structure.md) | 폴더 구조 |
| [code-style.md](rules/code-style.md) | 코드 스타일 |

## 라이선스

UNLICENSED - Private Project
