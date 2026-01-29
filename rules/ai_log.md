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

2026.01.23
    - 백엔드 개발 4단계 완료 (인증 모듈 구현)
        - JWT 및 인증 패키지 설치 완료
            - @nestjs/jwt, @nestjs/passport 설치
            - passport, passport-jwt 설치
            - bcrypt, @types/bcrypt, @types/passport-jwt 설치
        - Auth 모듈 구조 생성 완료
            - src/auth/dto/ (DTO)
            - src/auth/guards/ (가드)
            - src/auth/strategies/ (전략)
            - src/auth/decorators/ (데코레이터)
        - DTO 작성 완료
            - RegisterDto: 회원가입 요청 검증
            - LoginDto: 로그인 요청 검증
        - Auth Service 작성 완료
            - register(): 회원가입 (이메일 중복 확인, 비밀번호 해싱)
            - login(): 로그인 (비밀번호 검증, JWT 토큰 발급)
            - logout(): 로그아웃 (Refresh Token 삭제)
            - generateTokens(): Access/Refresh Token 생성
            - validateUser(): 사용자 유효성 검증
        - Auth Controller 작성 완료
            - POST /auth/register: 회원가입
            - POST /auth/login: 로그인
            - POST /auth/logout: 로그아웃 (인증 필요)
            - GET /auth/me: 현재 사용자 정보 (인증 필요)
        - JWT Strategy 구현 완료
            - passport-jwt 전략 구현
            - Access Token 검증
        - JWT Auth Guard 구현 완료
            - 인증이 필요한 엔드포인트 보호
        - CurrentUser 데코레이터 구현 완료
            - 요청에서 현재 사용자 정보 추출
        - AuthModule 작성 및 AppModule 통합 완료
        - API 테스트 완료
            - ✅ 회원가입: POST /auth/register
            - ✅ 로그인: POST /auth/login (토큰 발급 확인)
            - ✅ 사용자 정보: GET /auth/me (인증 확인)
            - ✅ 로그아웃: POST /auth/logout

    - 백엔드 개발 5단계 완료 (콘텐츠 타입 모듈 구현)
        - @nestjs/mapped-types 패키지 설치 완료
        - ContentType 모듈 구조 생성 완료
            - src/content-type/dto/ (DTO)
            - src/content-type/content-type.service.ts
            - src/content-type/content-type.controller.ts
            - src/content-type/content-type.module.ts
        - DTO 작성 완료
            - CreateContentTypeDto: 콘텐츠 타입 생성 검증
                - name, slug, description, fields, options 필드
                - slug 정규식 검증 (/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            - UpdateContentTypeDto: PartialType 사용
        - ContentType Service 작성 완료
            - create(): 콘텐츠 타입 생성 (slug 중복 확인)
            - findAll(): 전체 목록 조회 (생성일 기준 내림차순)
            - findOne(): 단일 조회 (ID 기준)
            - findBySlug(): 단일 조회 (slug 기준)
            - update(): 콘텐츠 타입 수정 (slug 중복 확인)
            - remove(): 콘텐츠 타입 삭제 (참조 무결성 확인)
        - ContentType Controller 작성 완료
            - POST /content-types: 생성 (인증 필요)
            - GET /content-types: 목록 조회 (인증 필요)
            - GET /content-types/:id: 단일 조회 (인증 필요)
            - PATCH /content-types/:id: 수정 (인증 필요)
            - DELETE /content-types/:id: 삭제 (인증 필요)
        - ContentTypeModule 작성 및 AppModule 통합 완료
        - API 테스트 완료
            - ✅ 콘텐츠 타입 생성: POST /content-types
            - ✅ 콘텐츠 타입 목록: GET /content-types
        - [수정 사항] CreateContentTypeDto에서 icon 필드를 options로 변경 (Prisma 스키마와 일치)

    - API 문서화 및 아키텍처 문서 작성 (2026.01.23)
        - Swagger 설정 완료
            - @nestjs/swagger 패키지 설치
            - main.ts에 Swagger 설정 추가
                - DocumentBuilder로 API 문서 메타데이터 설정
                - Bearer JWT 인증 설정 추가
                - API 태그 정의 (Auth, Content Types)
                - Swagger UI 경로: http://localhost:3000/api-docs
            - persistAuthorization 옵션 활성화 (토큰 자동 저장)
        - Auth API Swagger 데코레이터 추가
            - RegisterDto, LoginDto에 @ApiProperty 추가
            - AuthController에 @ApiTags, @ApiOperation, @ApiResponse 추가
            - 각 API별 요청/응답 예시 및 설명 작성
        - ContentType API Swagger 데코레이터 추가
            - CreateContentTypeDto에 @ApiProperty 추가
            - ContentTypeController에 @ApiTags, @ApiOperation, @ApiResponse 추가
            - 모든 엔드포인트에 인증 설명 (@ApiBearerAuth)
        - architecture.md 아키텍처 문서 작성 완료
            - 시스템 개요 및 핵심 아키텍처 패턴 설명
            - 기술 스택 상세 정리 (버전, 용도)
            - 폴더 구조 및 모듈 설명
            - 데이터베이스 설계 다이어그램 (ER 다이어그램)
            - 인증 및 권한 시스템 플로우 차트
            - API 구조 및 예시 (Auth, ContentType)
            - 모듈 의존성 그래프
            - 전역 설정 (Validation, Exception Filter, CORS)
            - 보안 고려사항 (비밀번호, JWT, SQL Injection, XSS)
            - 향후 개발 예정 기능 목록
            - 개발 가이드 (새 모듈 추가 체크리스트, Swagger 작성법)
        - 프론트엔드 개발자를 위한 문서화 완료
            - Swagger UI로 모든 API를 브라우저에서 테스트 가능
            - 요청/응답 형식, 예시 자동 생성
            - JWT 인증 테스트 지원
        - [중요] 앞으로 새 API 개발 시 반드시 Swagger 데코레이터 추가 필수

    - 백엔드 개발 6단계 완료 (콘텐츠 모듈 구현) (2026.01.26)
        - Content 모듈 구조 생성 완료
            - src/content/dto/ (DTO)
            - src/content/content.service.ts
            - src/content/content.controller.ts
            - src/content/content.module.ts
        - DTO 작성 완료
            - CreateContentDto: 콘텐츠 생성 검증
                - contentTypeId, title, slug, data, status, scheduledAt 필드
                - slug 정규식 검증 (/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
                - data는 ContentType의 fields 정의에 따라 동적 구성
            - UpdateContentDto: PartialType 사용
        - Content Service 작성 완료 (10개 메서드)
            - create(): 콘텐츠 생성 (ContentType 존재 확인, slug 중복 확인, 초기 버전 히스토리 생성)
            - findAll(): 전체 목록 조회 (필터링, 검색, 페이지네이션 지원)
            - findOne(): 단일 조회 (ID 기준)
            - findBySlug(): 단일 조회 (contentTypeId + slug)
            - update(): 콘텐츠 수정 (slug 중복 확인, 버전 증가, 히스토리 저장)
            - remove(): 콘텐츠 삭제 (소프트 삭제 - deletedAt)
            - publish(): 콘텐츠 발행 (status → PUBLISHED, publishedAt 기록)
            - unpublish(): 콘텐츠 미발행 (status → DRAFT)
            - getVersions(): 버전 히스토리 조회
            - restoreVersion(): 특정 버전으로 복원 (복원도 새 버전으로 기록)
        - Content Controller 작성 완료 (10개 엔드포인트)
            - POST /contents: 생성 (인증 필요)
            - GET /contents: 목록 조회 (쿼리: contentTypeId, status, search, page, limit)
            - GET /contents/:id: 단일 조회 (인증 필요)
            - GET /contents/:contentTypeId/slug/:slug: slug로 조회 (인증 필요)
            - PATCH /contents/:id: 수정 (인증 필요)
            - DELETE /contents/:id: 삭제 (인증 필요)
            - POST /contents/:id/publish: 발행 (인증 필요)
            - POST /contents/:id/unpublish: 미발행 (인증 필요)
            - GET /contents/:id/versions: 버전 히스토리 (인증 필요)
            - POST /contents/:id/versions/:version/restore: 버전 복원 (인증 필요)
        - ContentModule 작성 및 AppModule 통합 완료
        - main.ts에 Swagger 태그 추가 (Contents)
        - Swagger 데코레이터 추가 완료
            - CreateContentDto에 @ApiProperty 추가
            - ContentController에 @ApiTags, @ApiOperation, @ApiResponse, @ApiQuery 추가
            - 모든 엔드포인트에 인증 설명 (@ApiBearerAuth)
        - API 테스트 완료
            - ✅ 콘텐츠 생성: POST /contents (초기 버전 1 자동 생성)
            - ✅ 콘텐츠 목록: GET /contents (필터링, 페이지네이션 작동)
            - ✅ 콘텐츠 수정: PATCH /contents/:id (버전 2 생성)
            - ✅ 버전 히스토리: GET /contents/:id/versions (버전 1, 2 기록 확인)
            - ✅ 콘텐츠 발행: POST /contents/:id/publish (status → PUBLISHED)
            - ✅ 버전 복원: POST /contents/:id/versions/1/restore (버전 3 생성)
        - 주요 기능 구현 완료
            - 버전 관리 시스템 (create/update 시 자동 저장, 복원 시 새 버전 생성)
            - 예약 발행 (scheduledAt 필드)
            - 소프트 삭제 (deletedAt 필드)
            - ContentType 관계 (외래키 제약)
            - 사용자 추적 (createdBy, updatedBy)
            - 페이지네이션 및 필터링 (status, contentTypeId, search)
        - [수정 사항] Prisma JsonValue 타입 이슈 해결 (as any 타입 캐스팅)
    - 데이터베이스 시드 설정
        - backend/prisma/seed.ts 작성 (역할 데이터 초기화)
            - 4개의 기본 역할 생성 (슈퍼 관리자, 관리자, 편집자, 뷰어)
            - 중복 방지 로직 (slug 기준 확인 후 생성)
            - Prisma 7.x 호환 (PrismaPg adapter 사용)
        - backend/package.json에 "db:seed" 스크립트 추가
        - backend/check-db.js 업데이트
            - PrismaPg adapter 적용
            - 역할 확인 로직 추가
        - [개념 정리] 시드 데이터 vs 테스트 데이터
            - 시드 데이터: 선택적 초기 데이터 (역할, 기본 설정 등)
            - 테스트 데이터: 개발/테스트용 데이터 (로컬에만 존재)
            - Git에는 스키마 정의와 마이그레이션만 포함
            - 새 설치 시 빈 테이블 생성 (blank canvas 원칙 유지)
        - 실행 방법: `pnpm --filter backend db:seed`

2026.01.29
    - Admin Panel 프론트엔드 기본 아키텍처 구현 완료 (1단계)
        - React 프로젝트 초기화
            - JavaScript 사용 (TypeScript 미사용)
            - Vite 7.x, React 19.2.x (최신 버전)
            - React Compiler 설정 (babel-plugin-react-compiler)
            - Tailwind CSS 미사용 결정
        - Context Provider 패턴 구현 (Zustand 대신)
            - APIProvider: Axios 인스턴스 + 인터셉터 (tokenRef 패턴)
                - 모듈 레벨에서 axios 인스턴스 생성
                - 요청 인터셉터: tokenRef에서 accessToken 읽어서 첨부
                - 응답 인터셉터: 401 시 자동 토큰 갱신 후 재시도
                - useAPI() 훅으로 axios 인스턴스 제공
            - UserProvider: 인증 상태 관리 (useState + localStorage)
                - accessToken: 메모리만 유지 (보안)
                - refreshToken, user: localStorage 저장 (새로고침 시 복원)
                - login, logout, refresh 함수 제공
                - tokenRef.current 업데이트 (APIProvider와 연동)
                - useAPI() 사용하여 APIProvider의 axios 인스턴스로 요청
            - GlobalProvider: 전역 서버 데이터 캐싱 (TanStack Query)
                - contentTypes 목록 캐싱
                - enabled: !!user (로그인 시에만 fetch)
                - useAPI() + useUser() 사용
        - tokenRef 패턴으로 순환 의존성 해결
            - 문제: UserProvider는 APIProvider의 axios 필요, APIProvider 인터셉터는 UserProvider의 토큰 필요
            - 해결: 모듈 레벨 ref (tokenRef)로 두 Provider 간 브릿지
            - APIProvider는 tokenRef에서 토큰 읽기
            - UserProvider는 tokenRef 업데이트
        - Provider 중첩 구조 구현
            - QueryClientProvider > BrowserRouter > APIProvider > UserProvider > GlobalProvider
            - 의존성 순서에 따른 중첩 (하위 Provider가 상위 Provider 사용)
        - TanStack Query 클라이언트 설정
            - staleTime: 5분, gcTime: 30분
            - retry: 1, refetchOnWindowFocus: false
            - 상세 주석 추가 (각 옵션 의미 설명)
        - 패키지 설치 완료
            - react-router-dom, @tanstack/react-query, axios
            - react-hook-form, zod, lucide-react, sonner
            - babel-plugin-react-compiler (React Compiler)
        - [중요] 모든 API 요청은 APIProvider를 통해서만 수행
            - 컴포넌트/훅에서 useAPI() 사용
            - 정적 import로 axios 가져오기 금지
        - [중요] useMemo, useCallback, React.memo 사용 금지
            - React Compiler가 자동 최적화 수행
            - 일반적인 방식으로 컴포넌트 작성
    - frontend.md 문서 대폭 업데이트
        - 핵심 아키텍처 결정사항 섹션 추가 (최상단)
            - React Compiler 사용 (수동 메모이제이션 금지)
            - Context Provider 패턴 (Zustand 사용 안 함)
            - tokenRef 패턴 (순환 의존성 해결)
            - 모든 API 요청은 APIProvider 경유
            - JavaScript 사용 (TypeScript 아님)
            - Tailwind CSS 사용 안 함
        - Section 1 (기술 스택) 업데이트
            - Tailwind CSS, shadcn/ui 제거
        - Section 2 (프로젝트 구조) 업데이트
            - shared 폴더 현재 사용 안 함 명시
            - main.jsx Provider 중첩 구조 상세 설명 추가
            - 각 Provider의 의존성 관계 문서화
        - Section 3 (상태 관리) 전면 재작성
            - Zustand 관련 내용 제거
            - Provider 중첩 구조 및 순서 이유 설명
            - UserContext 전체 구현 코드 추가
            - GlobalContext 구현 코드 추가
            - localStorage persistence 전략 설명
        - Section 4 (API 통신) 전면 재작성
            - tokenRef 패턴 상세 설명 추가
            - 순환 의존성 문제 및 해결 방법 문서화
            - API 함수 사용 패턴 2가지 방법 제시
            - useAPI() 훅 사용 패턴 강조
        - Section 5 (인증 처리) 전면 재작성
            - Zustand 기반 코드 제거
            - UserContext 기반 인증 처리 설명
            - 자동 토큰 갱신 흐름 문서화
            - AuthGuard, LoginPage, 로그아웃 예시 코드 추가
        - Section 11 (성능 최적화) 강화
            - React Compiler 사용 시 주의사항 강조
            - 잘못된 방식(수동 메모이제이션) vs 올바른 방식 비교
            - Context Provider value 메모이제이션 불필요 명시
        - 실제 구현된 코드와 문서 완전 일치 달성

### 다음 작업 (프론트엔드 개발 2단계)
    - 2단계: 로그인 페이지 및 라우팅 구현
        - AuthGuard 컴포넌트 작성
        - 로그인 페이지 UI 및 폼 구현 (React Hook Form + Zod)
        - 라우터 설정 (공개 라우트 + 보호 라우트)
        - App.jsx 라우팅 구조 구현
    - 3단계: 레이아웃 및 대시보드
        - AdminLayout (Sidebar + Header + 메인 영역)
        - Sidebar 메뉴 구조 (동적 콘텐츠 타입 포함)
        - Header (사용자 정보, 로그아웃)
        - 대시보드 기본 페이지
    - 백엔드 개발 7단계: 미디어 모듈 구현
        - Media CRUD API
        - 파일 업로드/다운로드
        - 폴더 구조 관리
        - 썸네일 자동 생성

