# AI 작업 로그

## 이 파일의 목적

AI 에이전트가 새 채팅을 시작할 때 프로젝트를 빠르게 이해할 수 있도록 돕는 문서이다.

## 프로젝트 이해 가이드

### 1. 프로젝트 개요

이 프로젝트는 **범용 CMS 플랫폼**을 구축하는 프로젝트이다.

- **컨셉**: "빈 도화지" CMS - 초기 상태에서 아무 구조 없이 시작, 사용자가 자유롭게 설계
- **용도**: SI 회사에서 활용할 솔루션, 외부 사업 수주 시 어필 포인트
- **기술 스택**: NestJS (백엔드) + React (프론트엔드) + PostgreSQL + Prisma

### 2. 핵심 문서

| 문서 | 위치 | 내용 | 상태 |
|------|------|------|------|
| **프로젝트 기획** | `rules/project.md` | 전체 기능 명세, 플랫폼 구조, 기술 스택 | 완성 |
| **용어 정의** | `rules/glossary.md` | 프로젝트 전체 용어 통일 | 완성 |
| **사용자 시나리오** | `rules/scenarios.md` | 주요 기능별 사용 시나리오 | 완성 |
| **백엔드 명세** | `rules/backend.md` | 백엔드 기술 구현 명세 | 완성 |
| **프론트엔드 명세** | `rules/frontend.md` | 프론트엔드 기술 구현 명세 | 완성 |
| **폴더 구조** | `rules/structure.md` | 디렉토리 구조 규칙 | 완성 |
| **코드 스타일** | `rules/code-style.md` | 코딩 컨벤션 | 완성 |

### 3. project.md 구조 요약

```
project.md
├── 프로젝트 개요
│   ├── 프로젝트 목표
│   ├── 핵심 컨셉 (20+ 기능)
│   └── 프로젝트 배경
├── 플랫폼 구조
│   ├── 1. 관리자 페이지 (Admin Panel)
│   │   ├── 메뉴 구조
│   │   └── 메뉴별 상세 설명
│   ├── 2. 사용자 페이지 (Public Site)
│   │   ├── 페이지 구축 플로우
│   │   ├── 동적 페이지 지원
│   │   ├── 페이지 타입
│   │   ├── 공통 레이아웃
│   │   ├── 시스템 페이지
│   │   └── 컴포넌트 시스템
│   ├── 3. 권한 시스템
│   ├── 4. SEO 관리
│   ├── 5. 실시간 미리보기
│   ├── 6. 검색 기능
│   ├── 7. 로그 시스템
│   ├── 8. 백업/복원
│   ├── 9. Import/Export
│   ├── 10. 휴지통
│   ├── 11. 워크플로우
│   ├── 12. 내부 댓글/메모
│   ├── 13. 알림 센터
│   ├── 14. 이미지 최적화
│   └── 15. API (REST + GraphQL)
├── 기술 스택
├── 코드 스타일 (별도 문서 참조)
├── 폴더 구조 규칙 (별도 문서 참조)
├── 백엔드 개발방향
└── 프론트엔드 개발방향
```

### 4. 주요 기능 키워드

- 콘텐츠 타입 정의, 페이지 빌더, 드래그앤드롭
- 역할(Role) 기반 권한 시스템
- 다국어(i18n), 버전 관리, 예약 발행
- REST/GraphQL API 자동 생성
- 워크플로우 (승인 시스템), 알림 센터
- 이미지 최적화, SEO 관리

### 5. AI 작업 시 참고사항

- 기능 추가/수정 시 `project.md`를 먼저 읽고 전체 맥락 파악
- 핵심 컨셉, 메뉴 구조, 상세 섹션 3곳 모두 업데이트 필요
- 코드 작성 전 `code-style.md`, `structure.md` 확인 (작성 후)

---

## 작업 기록

기록 방식:
```
YYYY.MM.DD HH:MM
    - 내용
```

----------------------------------------------------

2026.01.07
    - 프로젝트 기획 완료 (project.md)
    - CMS 핵심 기능 정의: 콘텐츠 관리, 페이지 빌더, 권한 시스템, API, 알림 센터 등 15개 섹션
    - 기술 스택 결정: NestJS + React + PostgreSQL + Prisma

2026.01.08
    - glossary.md 작성 (용어 정의)
    - scenarios.md 작성 (사용자 시나리오 10개)
    - backend.md 작성 (백엔드 기술 명세 9개 섹션)
        - 인증/보안, 콘텐츠 타입 시스템, DB 설계, API 설계, 파일 저장소, 캐싱, 모듈 구조, 에러 코드, 환경 변수
    - frontend.md 작성 (프론트엔드 기술 명세 11개 섹션)
        - 기술 스택, 프로젝트 구조, 상태 관리, API 통신, 인증 처리, 라우팅, UI 컴포넌트, 페이지 빌더, 폼 관리, i18n, 성능 최적화
    - structure.md 작성 (폴더 구조 명세)
        - 전체 모노레포 구조, 백엔드 NestJS 구조, 프론트엔드 React 구조, 공유 패키지, 파일 네이밍 규칙
    - code-style.md 작성 (코딩 컨벤션 5개 섹션)
        - 공통 규칙, TypeScript 규칙, 프론트엔드(React) 규칙, 백엔드(NestJS) 규칙, Git 컨벤션
    - 프로젝트 초기 설정 완료
        - .gitignore 작성 (의존성, 빌드, 환경변수, 업로드, IDE, 테스트, Prisma, 캐시 등)
        - 폴더 구조 생성: backend/, frontend/packages/, packages/types/, uploads/, docs/
        - pnpm-workspace.yaml 생성 (모노레포 워크스페이스 설정)
        - 루트 package.json 생성 (워크스페이스 스크립트 정의)
        - .env.example 생성 (환경 변수 템플릿)
        - README.md 작성 (프로젝트 개요, 시작 방법, 문서 링크)
        - structure.md 업데이트: apps/backend → backend 구조 변경
    - 백엔드 개발 시작 (1단계 완료)
        - NestJS 프로젝트 생성 (CLI 사용)
        - pnpm install 완료 (모노레포 워크스페이스 연동)
        - 개발 서버 실행 테스트 완료 (pnpm dev:backend)
        - [미완료] Prisma 설치 - Node.js 버전 이슈 (현재 20.14.0, Prisma 요구 20.19+)

2026.01.09
    - 백엔드 개발 2단계 완료 (Prisma 설정 및 DB 연결)
        - Node.js 20.19.0으로 업그레이드
        - Prisma 7.2.0 설치 및 초기화
        - PostgreSQL 18.1 설치 및 확인
        - Prisma 스키마 작성 완료 (15개 모델, 6개 Enum)
            - User, Role, UserRole, RefreshToken (인증/권한)
            - ContentType, Content, ContentVersion (콘텐츠)
            - Page (페이지 빌더)
            - Media, MediaFolder (미디어 관리)
            - WorkflowAction (워크플로우)
            - Comment, Notification, AuditLog (부가 기능)
            - Setting, Webhook (시스템 설정)
        - 환경 변수 설정 (backend/.env)
            - DATABASE_URL 설정
            - JWT, 파일 업로드, CORS 설정
        - PostgreSQL cms_db 데이터베이스 생성
        - Prisma 마이그레이션 실행 (20260109052456_init)
            - 15개 테이블 생성 완료
            - 인덱스 및 외래 키 설정 완료
    - Prisma 학습 문서 작성 (prisma_study.md)
        - Prisma 개념, DBMS 역할, 사용법 등 종합 가이드
        - 마이그레이션, Enum, 테이블, 인덱스, 외래키 설명
        - Prisma 명령어, 한계점, 작업 후 체크리스트
        - Prisma 문법 및 작성 방법 (8개 섹션)
    - 백엔드 개발 3단계 완료 (기본 모듈 구조 설정)
        - Prisma Client 생성 완료 (npx prisma generate)
        - 기본 폴더 구조 생성 완료
            - src/common/ (decorators, filters, guards, interceptors, pipes, utils)
            - src/config/
            - src/prisma/
        - Prisma 서비스 및 모듈 생성 완료
            - PrismaService: DB 연결/해제 관리 (Prisma 7.x adapter 방식)
            - PrismaModule: Global 모듈로 설정
        - 환경 설정 모듈 작성 완료
            - @nestjs/config 패키지 설치
            - configuration.ts: 환경 변수 구조화
            - env.validation.ts: 환경 변수 검증 (class-validator)
            - ConfigModule을 AppModule에 Global 설정
        - 전역 예외 필터 작성 완료
            - AllExceptionsFilter: HTTP 예외 처리
            - 개발/프로덕션 환경별 에러 로그 분기
        - AppModule 설정 완료
            - ConfigModule 통합 (isGlobal: true)
            - PrismaModule 통합
            - Validation Pipe 전역 설정
            - CORS 설정 (Admin/Public URL)
        - main.ts 설정 완료
            - ValidationPipe 전역 적용 (whitelist, transform)
            - AllExceptionsFilter 전역 적용
            - CORS 활성화
        - Prisma 7.x 대응 완료
            - @prisma/adapter-pg, pg, @types/pg 설치
            - PrismaPg adapter 연동
            - schema.prisma에서 datasource url 제거
        - 개발 서버 실행 테스트 성공
            - Database 연결 확인 (✅ Database connected)
            - http://localhost:3000 실행 확인

### 다음 작업 (백엔드 개발 4단계)
    - 4단계: 인증 모듈 구현
        - JWT 인증 (Access Token + Refresh Token)
        - 로그인/로그아웃/회원가입 API
        - 비밀번호 해싱 (bcrypt)
        - 인증 가드 및 데코레이터

