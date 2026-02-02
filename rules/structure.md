# 폴더 구조 (Project Structure)

이 문서는 CMS 프로젝트의 전체 디렉토리 구조를 정의한다.

---

## 목차

1. [전체 구조](#1-전체-구조)
2. [백엔드 구조](#2-백엔드-구조)
3. [프론트엔드 구조](#3-프론트엔드-구조)
4. [공유 패키지](#4-공유-패키지)
5. [파일 네이밍 규칙](#5-파일-네이밍-규칙)

---

## 1. 전체 구조

프로젝트는 **모노레포(Monorepo)** 구조로 관리한다.

```
cms-project/
├── backend/                  # NestJS 백엔드
│
├── frontend/
│   ├── admin/                # Admin Panel (React, JavaScript)
│   ├── user/                 # Public Site (React, 미구현) [Business+]
│   └── shared/               # 프론트엔드 공유 코드 (현재 비어있음)
│
├── packages/
│   └── types/                # 백엔드-프론트엔드 공유 타입
│
├── uploads/                  # 업로드 파일 저장소 (gitignore)
│
├── rules/                    # 프로젝트 규칙/기획 문서
│   ├── project.md            # 프로젝트 기획 (에디션 전략 포함)
│   ├── architecture.md       # 백엔드 아키텍처
│   ├── backend.md            # 백엔드 기술 명세
│   ├── frontend.md           # 프론트엔드 기술 명세
│   ├── structure.md          # 폴더 구조 (이 파일)
│   ├── code-style.md         # 코드 스타일 가이드
│   ├── glossary.md           # 용어 정의
│   ├── scenarios.md          # 시나리오
│   ├── rules.md              # 개발 규칙
│   ├── requirement.md        # 요구사항
│   └── ai_log.md             # AI 작업 로그
│
├── .gitignore
├── package.json              # 루트 package.json (워크스페이스)
├── pnpm-workspace.yaml       # pnpm 워크스페이스 설정
└── README.md
```

### 패키지 매니저

**pnpm**을 사용한다. 워크스페이스 설정:

```yaml
# pnpm-workspace.yaml
packages:
  - 'backend'
  - 'frontend/*'
  - 'packages/*'
```

---

## 2. 백엔드 구조

### 전체 구조

```
backend/
├── src/
│   ├── main.ts                     # 애플리케이션 진입점
│   ├── app.module.ts               # 루트 모듈
│   │
│   ├── common/                     # 공통 유틸리티
│   │   ├── decorators/             # 커스텀 데코레이터
│   │   ├── filters/                # 예외 필터
│   │   ├── guards/                 # 가드
│   │   ├── interceptors/           # 인터셉터
│   │   ├── pipes/                  # 파이프
│   │   └── utils/                  # 유틸 함수
│   │
│   ├── config/                     # 설정 모듈
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── upload.config.ts
│   │
│   ├── modules/                    # 기능 모듈
│   │   ├── auth/                   # 인증 [Starter+]
│   │   ├── users/                  # 사용자 (관리자 + 회원) [Starter+]
│   │   ├── roles/                  # 역할/권한 [Starter+]
│   │   ├── content-types/          # 콘텐츠 타입 정의 [Starter+]
│   │   ├── contents/               # 콘텐츠 CRUD [Starter+]
│   │   ├── media/                  # 미디어 관리 [Starter+]
│   │   ├── notifications/          # 알림 [Starter+]
│   │   ├── audit-log/              # 감사 로그 (기본) [Starter+]
│   │   ├── backup/                 # 백업/복원 [Starter+]
│   │   ├── import-export/          # 가져오기/내보내기 [Starter+]
│   │   ├── trash/                  # 휴지통 [Starter+]
│   │   ├── search/                 # 검색 [Starter+]
│   │   ├── settings/               # 시스템 설정 [Starter+]
│   │   ├── webhooks/               # 웹훅 [Starter+]
│   │   ├── pages/                  # 페이지 관리 [Business]
│   │   ├── templates/              # 템플릿 관리 [Business]
│   │   ├── components/             # 컴포넌트 관리 [Business]
│   │   ├── workflow/               # 승인 워크플로우 [Enterprise]
│   │   ├── internal-comment/       # 내부 댓글/메모 [Enterprise]
│   │   ├── sso/                    # SSO 연동 [Enterprise]
│   │   ├── multi-site/             # 멀티사이트 [Enterprise]
│   │   └── api-analytics/          # API 분석 [Enterprise]
│   │
│   └── database/                   # 데이터베이스
│       └── prisma/
│           ├── schema.prisma       # Prisma 스키마
│           ├── migrations/         # 마이그레이션
│           └── seed.ts             # 시드 데이터
│
├── test/                           # 테스트
│   ├── e2e/                        # E2E 테스트
│   └── unit/                       # 유닛 테스트
│
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
└── .env.example
```

### 모듈 구조 상세

각 모듈은 다음 구조를 따른다:

```
modules/contents/
├── contents.module.ts              # 모듈 정의
├── contents.controller.ts          # 컨트롤러 (REST API)
├── contents.service.ts             # 비즈니스 로직
├── contents.repository.ts          # 데이터 접근 (선택)
├── dto/                            # Data Transfer Objects
│   ├── create-content.dto.ts
│   ├── update-content.dto.ts
│   └── content-query.dto.ts
├── entities/                       # 엔티티 (Prisma와 매핑)
│   └── content.entity.ts
├── interfaces/                     # 인터페이스
│   └── content.interface.ts
└── __tests__/                      # 모듈별 테스트
    ├── contents.controller.spec.ts
    └── contents.service.spec.ts
```

### 인증 모듈 예시

```
modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   └── refresh-token.dto.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── decorators/
│   ├── current-user.decorator.ts
│   └── permissions.decorator.ts
└── interfaces/
    └── jwt-payload.interface.ts
```

### 콘텐츠 타입 모듈

```
modules/content-types/
├── content-types.module.ts
├── content-types.controller.ts
├── content-types.service.ts
├── dto/
│   ├── create-content-type.dto.ts
│   ├── update-content-type.dto.ts
│   └── field-definition.dto.ts
├── entities/
│   └── content-type.entity.ts
├── validators/                     # 필드 타입 검증
│   ├── field-validator.ts
│   └── relation-validator.ts
└── constants/
    └── field-types.constant.ts
```

---

## 3. 프론트엔드 구조

### Admin Panel (현재 구현 상태 반영)

> JavaScript 사용 (.jsx), TypeScript 아님. React Compiler + Context Provider 패턴.

```
frontend/admin/
├── src/
│   ├── main.jsx                    # 진입점 (Provider 중첩: Query > Router > Popup > API > User > Global)
│   ├── App.jsx                     # 루트 컴포넌트 (라우팅 설정)
│   │
│   ├── Providers/                  # Context Providers (useState 기반)
│   │   ├── PopupContext.jsx        # 팝업/로딩 스피너 전역 상태 (popupRef 패턴)
│   │   ├── APIContext.jsx          # Axios 인스턴스 + 인터셉터 (tokenRef + popupRef 패턴)
│   │   ├── UserContext.jsx         # 인증 상태 (login, logout, refresh, localStorage persist)
│   │   └── GlobalContext.jsx       # 전역 서버 데이터 (contentTypes, isMobile, sidebarOpen)
│   │
│   ├── Pages/                      # 페이지 컴포넌트
│   │   ├── System/
│   │   │   └── Login.jsx           # 로그인 (구현 완료)
│   │   ├── Router/                 # 섹션별 라우터 (Outlet 래퍼)
│   │   │   ├── ContentTypeRouter.jsx
│   │   │   ├── ContentRouter.jsx
│   │   │   ├── MediaRouter.jsx
│   │   │   └── RoleRouter.jsx
│   │   ├── Dashboard/
│   │   │   └── Dashboard.jsx       # 대시보드 (플레이스홀더)
│   │   ├── ContentType/
│   │   │   └── ContentTypeList.jsx # 콘텐츠 타입 목록 (플레이스홀더)
│   │   ├── Content/
│   │   │   └── ContentList.jsx     # 콘텐츠 목록 (플레이스홀더)
│   │   ├── Media/
│   │   │   └── MediaList.jsx       # 미디어 (플레이스홀더)
│   │   └── Role/
│   │       └── RoleList.jsx        # 역할 관리 (플레이스홀더)
│   │
│   ├── Components/                 # 공통 컴포넌트
│   │   ├── features/
│   │   │   └── AuthGuard.jsx       # 인증 가드 (라우트 보호)
│   │   ├── layout/                 # 레이아웃 (구현 완료)
│   │   │   ├── AdminLayout.jsx     # 관리자 레이아웃 (Sidebar + Header + Outlet)
│   │   │   ├── AppSidebar.jsx      # 사이드바 (고정메뉴 + 동적 콘텐츠 메뉴)
│   │   │   └── AppHeader.jsx       # 헤더 (브레드크럼 + 모바일 햄버거)
│   │   ├── ui/                     # Shadcn/ui 컴포넌트 (25개)
│   │   │   ├── button.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   └── ...
│   │   └── common/                 # 공통 UI (예정)
│   │
│   ├── hooks/                      # 커스텀 훅
│   │   └── use-mobile.js
│   │
│   ├── lib/                        # 유틸리티
│   │   ├── query-client.js         # TanStack Query 클라이언트 설정
│   │   └── utils.js                # cn() 유틸리티 (Shadcn/ui)
│   │
│   ├── Assets/                     # 정적 리소스
│   │   ├── images/
│   │   └── icons/
│   │
│   └── CSS/                        # 스타일시트
│       ├── index.css               # Tailwind + 레이아웃/사이드바/팝업 스타일
│       └── reset.css               # CSS 리셋 + CSS 변수 정의
│
├── index.html
├── vite.config.js                  # Vite 설정 (alias + React Compiler)
├── jsconfig.json                   # import alias (@/ → src/)
├── components.json                 # Shadcn/ui 설정
└── package.json
```

### Public Site (User Site) `[Business+]` — 미구현

> Business 에디션 이상에서만 제공. Phase A의 Business 에디션 개발 시 구현 예정.

```
frontend/user/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   │
│   ├── pages/                      # 페이지 컴포넌트
│   │   ├── HomePage.jsx
│   │   ├── DynamicPage.jsx         # 동적 페이지 렌더러
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── search/
│   │   │   └── SearchResultPage.jsx
│   │   └── error/
│   │       └── NotFoundPage.jsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Navigation.jsx
│   │   └── renderer/               # 페이지 렌더러
│   │       ├── PageRenderer.jsx
│   │       └── components/
│   │
│   ├── hooks/
│   ├── lib/
│   └── CSS/
│
├── index.html
├── vite.config.js
└── package.json
```

---

## 4. 공유 패키지

### 프론트엔드 공유 (shared) — 현재 미사용

> workspace 패키지 간 참조가 복잡하여 현재는 사용하지 않음. 필요 시 재검토 예정.

```
frontend/shared/
├── src/
│   ├── components/                 # 공유 컴포넌트
│   ├── hooks/                      # 공유 훅
│   ├── utils/                      # 공유 유틸
│   └── index.js
│
└── package.json
```

### 타입 공유 (types)

백엔드와 프론트엔드 간 공유되는 타입을 정의한다.

```
packages/types/
├── src/
│   ├── auth.ts                     # 인증 관련 타입
│   ├── content.ts                  # 콘텐츠 관련 타입
│   ├── content-type.ts             # 콘텐츠 타입 관련
│   ├── page.ts                     # 페이지 관련 타입
│   ├── media.ts                    # 미디어 관련 타입
│   ├── user.ts                     # 사용자 관련 타입
│   ├── api.ts                      # API 응답 타입
│   └── index.ts
│
├── tsconfig.json
└── package.json
```

**예시 - content-type.ts:**

```typescript
// packages/types/src/content-type.ts

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'image'
  | 'file'
  | 'select'
  | 'multiselect'
  | 'relation'
  | 'json'
  | 'color';

export interface FieldDefinition {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  unique: boolean;
  defaultValue?: unknown;
  options?: FieldOptions;
}

export interface FieldOptions {
  // 텍스트
  minLength?: number;
  maxLength?: number;

  // 숫자
  min?: number;
  max?: number;

  // 선택
  choices?: { label: string; value: string }[];

  // 관계
  targetType?: string;
  relationType?: 'oneToOne' | 'oneToMany' | 'manyToMany';
}

export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  fields: FieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 5. 파일 네이밍 규칙

### 공통 규칙

| 유형 | 네이밍 | 예시 |
|------|--------|------|
| 디렉토리 | kebab-case | `content-types/`, `page-builder/` |
| React 컴포넌트 | PascalCase | `ContentList.tsx`, `PageBuilder.tsx` |
| 훅 | camelCase (use 접두사) | `useContents.ts`, `useAuth.ts` |
| 유틸 함수 | camelCase | `formatDate.ts`, `parseQuery.ts` |
| 상수 | SCREAMING_SNAKE_CASE | `FIELD_TYPES.ts`, `ERROR_CODES.ts` |
| 타입/인터페이스 파일 | kebab-case + .types | `content.types.ts` |

### 백엔드 (NestJS)

| 유형 | 네이밍 | 예시 |
|------|--------|------|
| 모듈 | kebab-case + .module | `contents.module.ts` |
| 컨트롤러 | kebab-case + .controller | `contents.controller.ts` |
| 서비스 | kebab-case + .service | `contents.service.ts` |
| DTO | kebab-case + .dto | `create-content.dto.ts` |
| 가드 | kebab-case + .guard | `jwt-auth.guard.ts` |
| 인터셉터 | kebab-case + .interceptor | `logging.interceptor.ts` |
| 데코레이터 | kebab-case + .decorator | `current-user.decorator.ts` |

### 프론트엔드 (React, JavaScript)

| 유형 | 네이밍 | 예시 |
|------|--------|------|
| 페이지 | PascalCase | `ContentList.jsx`, `Dashboard.jsx` |
| 컴포넌트 | PascalCase | `ContentCard.jsx`, `AdminLayout.jsx` |
| 훅 | camelCase (use 접두사) | `use-mobile.js` |
| API 함수 | kebab-case + .api | `content.api.js` |
| Provider | PascalCase + Context | `UserContext.jsx`, `APIContext.jsx` |
| 유틸리티 | kebab-case | `query-client.js`, `utils.js` |

### 테스트 파일

| 유형 | 네이밍 | 예시 |
|------|--------|------|
| 유닛 테스트 | 원본파일명 + .spec | `contents.service.spec.ts` |
| E2E 테스트 | 기능명 + .e2e-spec | `auth.e2e-spec.ts` |
| 테스트 디렉토리 | `__tests__/` | `modules/contents/__tests__/` |

---

## 참고

- 모노레포 관리: pnpm workspace
- 백엔드: NestJS 공식 프로젝트 구조 기반
- 프론트엔드: Feature-Sliced Design 참고
