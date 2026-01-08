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
cms/
├── apps/
│   └── backend/              # NestJS 백엔드
│
├── frontend/
│   └── packages/
│       ├── admin/            # Admin Panel (React)
│       ├── public/           # Public Site (React)
│       └── shared/           # 프론트엔드 공유 코드
│
├── packages/
│   └── types/                # 백엔드-프론트엔드 공유 타입
│
├── uploads/                  # 업로드 파일 저장소 (gitignore)
│
├── docs/                     # 추가 문서
│
├── rules/                    # 프로젝트 규칙 문서
│   ├── project.md
│   ├── glossary.md
│   ├── scenarios.md
│   ├── backend.md
│   ├── frontend.md
│   ├── structure.md
│   ├── code-style.md
│   └── ai_log.md
│
├── .env.example              # 환경 변수 예시
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
  - 'apps/*'
  - 'frontend/packages/*'
  - 'packages/*'
```

---

## 2. 백엔드 구조

### 전체 구조

```
apps/backend/
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
│   │   ├── auth/                   # 인증
│   │   ├── users/                  # 사용자 (관리자 + 회원)
│   │   ├── roles/                  # 역할/권한
│   │   ├── content-types/          # 콘텐츠 타입 정의
│   │   ├── contents/               # 콘텐츠 CRUD
│   │   ├── pages/                  # 페이지 관리
│   │   ├── media/                  # 미디어 관리
│   │   ├── templates/              # 템플릿 관리
│   │   ├── components/             # 컴포넌트 관리
│   │   ├── workflow/               # 워크플로우
│   │   ├── notifications/          # 알림
│   │   ├── comments/               # 내부 댓글
│   │   ├── audit-log/              # 감사 로그
│   │   ├── backup/                 # 백업/복원
│   │   ├── import-export/          # 가져오기/내보내기
│   │   ├── trash/                  # 휴지통
│   │   ├── search/                 # 검색
│   │   ├── settings/               # 시스템 설정
│   │   └── webhooks/               # 웹훅
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

### Admin Panel

```
frontend/packages/admin/
├── src/
│   ├── main.tsx                    # 진입점
│   ├── App.tsx                     # 루트 컴포넌트
│   │
│   ├── app/                        # 앱 설정
│   │   ├── router.tsx              # 라우터 설정
│   │   └── providers.tsx           # Provider 래퍼
│   │
│   ├── pages/                      # 페이지 컴포넌트
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── content/
│   │   │   ├── ContentListPage.tsx
│   │   │   └── ContentEditPage.tsx
│   │   ├── content-type/
│   │   │   ├── ContentTypeListPage.tsx
│   │   │   └── ContentTypeEditPage.tsx
│   │   ├── page-builder/
│   │   │   └── PageBuilderPage.tsx
│   │   ├── media/
│   │   │   └── MediaPage.tsx
│   │   ├── members/
│   │   │   └── MemberListPage.tsx
│   │   ├── admins/
│   │   │   └── AdminListPage.tsx
│   │   ├── roles/
│   │   │   └── RoleListPage.tsx
│   │   ├── settings/
│   │   │   ├── GeneralSettingsPage.tsx
│   │   │   ├── LanguageSettingsPage.tsx
│   │   │   └── WebhookSettingsPage.tsx
│   │   └── error/
│   │       ├── NotFoundPage.tsx
│   │       └── UnauthorizedPage.tsx
│   │
│   ├── features/                   # 기능별 모듈
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   │   └── auth.api.ts
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── AuthGuard.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── content/
│   │   │   ├── api/
│   │   │   │   └── content.api.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useContents.ts
│   │   │   │   └── useContentMutation.ts
│   │   │   ├── components/
│   │   │   │   ├── ContentList.tsx
│   │   │   │   ├── ContentForm.tsx
│   │   │   │   └── DynamicForm.tsx
│   │   │   ├── types/
│   │   │   │   └── content.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── content-type/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   │   ├── ContentTypeList.tsx
│   │   │   │   ├── ContentTypeForm.tsx
│   │   │   │   └── FieldEditor.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── page-builder/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   │   └── page-builder.store.ts
│   │   │   ├── components/
│   │   │   │   ├── Canvas.tsx
│   │   │   │   ├── ComponentPalette.tsx
│   │   │   │   ├── PropertiesPanel.tsx
│   │   │   │   ├── LayersPanel.tsx
│   │   │   │   └── preview/
│   │   │   │       └── PreviewFrame.tsx
│   │   │   ├── registry/
│   │   │   │   ├── index.ts
│   │   │   │   └── components/
│   │   │   │       ├── Text/
│   │   │   │       ├── Image/
│   │   │   │       ├── Container/
│   │   │   │       └── ...
│   │   │   └── index.ts
│   │   │
│   │   ├── media/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   │   ├── MediaLibrary.tsx
│   │   │   │   ├── MediaUploader.tsx
│   │   │   │   ├── FolderTree.tsx
│   │   │   │   └── MediaPicker.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── ... (기타 features)
│   │
│   ├── components/                 # 공통 컴포넌트
│   │   ├── ui/                     # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                 # 레이아웃 컴포넌트
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Breadcrumb.tsx
│   │   │
│   │   ├── common/                 # 공통 UI
│   │   │   ├── DataTable.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   └── editor/                 # 에디터 컴포넌트
│   │       └── RichTextEditor.tsx
│   │
│   ├── hooks/                      # 전역 커스텀 훅
│   │   ├── useDebounce.ts
│   │   ├── useUrlParams.ts
│   │   └── usePermission.ts
│   │
│   ├── stores/                     # Zustand 스토어
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   │
│   ├── lib/                        # 유틸리티
│   │   ├── axios.ts
│   │   ├── query-client.ts
│   │   ├── query-keys.ts
│   │   ├── i18n.ts
│   │   └── utils.ts
│   │
│   ├── types/                      # TypeScript 타입
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   │
│   └── styles/                     # 전역 스타일
│       └── globals.css
│
├── public/
│   ├── locales/                    # 번역 파일
│   │   ├── ko/
│   │   │   ├── common.json
│   │   │   └── ...
│   │   └── en/
│   │       ├── common.json
│   │       └── ...
│   └── favicon.ico
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── components.json               # shadcn/ui 설정
```

### Public Site

```
frontend/packages/public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── app/
│   │   ├── router.tsx
│   │   └── providers.tsx
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── DynamicPage.tsx         # 동적 페이지 렌더러
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── search/
│   │   │   └── SearchResultPage.tsx
│   │   └── error/
│   │       └── NotFoundPage.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── content/
│   │   └── search/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   └── renderer/               # 페이지 렌더러
│   │       ├── PageRenderer.tsx
│   │       └── components/
│   │           ├── TextRenderer.tsx
│   │           ├── ImageRenderer.tsx
│   │           └── ...
│   │
│   ├── hooks/
│   ├── stores/
│   ├── lib/
│   ├── types/
│   └── styles/
│
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 4. 공유 패키지

### 프론트엔드 공유 (shared)

```
frontend/packages/shared/
├── src/
│   ├── components/                 # 공유 컴포넌트
│   │   └── ...
│   ├── hooks/                      # 공유 훅
│   │   └── ...
│   ├── utils/                      # 공유 유틸
│   │   └── ...
│   └── index.ts
│
├── tsconfig.json
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

### 프론트엔드 (React)

| 유형 | 네이밍 | 예시 |
|------|--------|------|
| 페이지 | PascalCase + Page | `ContentListPage.tsx` |
| 컴포넌트 | PascalCase | `ContentCard.tsx` |
| 훅 | camelCase (use 접두사) | `useContentMutation.ts` |
| API 함수 | kebab-case + .api | `content.api.ts` |
| 스토어 | kebab-case + .store | `auth.store.ts` |
| 타입 | kebab-case + .types | `content.types.ts` |

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
