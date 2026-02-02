# 백엔드 아키텍처 문서

## 목차
1. [시스템 개요](#시스템-개요)
2. [기술 스택](#기술-스택)
3. [폴더 구조](#폴더-구조)
4. [데이터베이스 설계](#데이터베이스-설계)
5. [인증 및 권한 시스템](#인증-및-권한-시스템)
6. [API 구조](#api-구조)
7. [모듈 의존성](#모듈-의존성)

---

## 시스템 개요

이 CMS 플랫폼은 **NestJS 프레임워크** 기반의 RESTful API 서버입니다. 모듈화된 구조로 설계되어 있으며, 각 모듈은 독립적으로 동작하면서 필요한 의존성을 주입받습니다.

### 핵심 아키텍처 패턴
- **Layered Architecture**: Controller → Service → Repository (Prisma)
- **Dependency Injection**: NestJS IoC 컨테이너 활용
- **Module-based Design**: 기능별 독립 모듈
- **Edition-aware Architecture**: 환경변수 `CMS_EDITION`(`starter`|`business`|`enterprise`)에 따라 모듈 활성화/비활성화

### 에디션별 모듈 구성

| 모듈 | Starter | Business | Enterprise |
|------|:-------:|:--------:|:----------:|
| Auth, ContentType, Content, Media, Role | ✅ | ✅ | ✅ |
| Page, Template, Component (페이지 빌더) | ❌ | ✅ | ✅ |
| Workflow, InternalComment | ❌ | ❌ | ✅ |
| AuditLog Dashboard, SSO, MultiSite | ❌ | ❌ | ✅ |

에디션별 모듈 분기는 `AppModule`에서 `CMS_EDITION` 값을 확인하여 조건부로 import 합니다.

---

## 기술 스택

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **런타임** | Node.js | 20.19.0+ | JavaScript 런타임 |
| **프레임워크** | NestJS | 11.x | 백엔드 프레임워크 |
| **언어** | TypeScript | 5.x | 타입 안전성 |
| **데이터베이스** | PostgreSQL | 18.1 | 관계형 데이터베이스 |
| **ORM** | Prisma | 7.x | 데이터베이스 ORM |
| **인증** | JWT | - | 토큰 기반 인증 |
| **비밀번호 암호화** | bcrypt | - | 해시 암호화 |
| **검증** | class-validator | - | DTO 검증 |
| **문서화** | Swagger | 11.x | API 문서 자동 생성 |
| **이미지 처리** | Sharp | 0.34.x | 리사이즈, WebP 변환, 썸네일 |
| **작업 큐** | BullMQ | 11.x | 비동기 작업 (Redis 필요) |
| **크론** | @nestjs/schedule | 6.x | 예약 발행, 자동 정리 |
| **Rate Limit** | @nestjs/throttler | 6.5.x | API 요청 제한 |
| **HTML 정제** | isomorphic-dompurify | 2.x | XSS 방지 |
| **검색** | MeiliSearch | 1.19.x | 콘텐츠 검색 (교체 가능) |

---

## 폴더 구조

```
backend/
├── src/
│   ├── app.module.ts           # 루트 모듈
│   ├── main.ts                 # 애플리케이션 진입점
│   │
│   ├── config/                 # 환경 설정
│   │   ├── configuration.ts    # 환경 변수 구조화
│   │   └── env.validation.ts   # 환경 변수 검증
│   │
│   ├── common/                 # 공통 모듈
│   │   ├── filters/            # 예외 필터
│   │   ├── guards/             # 가드
│   │   ├── interceptors/       # 인터셉터
│   │   ├── pipes/              # 파이프
│   │   ├── decorators/         # 데코레이터
│   │   └── utils/              # 유틸리티
│   │
│   ├── prisma/                 # Prisma 모듈
│   │   ├── prisma.service.ts   # Prisma 클라이언트 관리
│   │   └── prisma.module.ts    # Prisma 모듈
│   │
│   ├── auth/                   # 인증 모듈
│   │   ├── dto/                # 요청 DTO
│   │   ├── guards/             # JWT 가드
│   │   ├── strategies/         # Passport 전략
│   │   ├── decorators/         # 커스텀 데코레이터
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   └── auth.module.ts
│   │
│   └── content-type/           # 콘텐츠 타입 모듈
│       ├── dto/
│       ├── content-type.service.ts
│       ├── content-type.controller.ts
│       └── content-type.module.ts
│
├── prisma/
│   ├── schema.prisma           # Prisma 스키마
│   └── migrations/             # 마이그레이션 파일들
│
└── .env                        # 환경 변수
```

---

## 데이터베이스 설계

### 주요 테이블 및 관계

```
┌─────────────┐
│   users     │
├─────────────┤
│ id          │──┐
│ email       │  │
│ password    │  │
│ name        │  │
│ type        │  │
└─────────────┘  │
                 │
                 │ 1:N
                 │
┌────────────────┼─────────┐
│                ↓         │
│  ┌──────────────────┐   │
│  │ refresh_tokens   │   │
│  ├──────────────────┤   │
│  │ id               │   │
│  │ userId (FK)      │   │
│  │ token            │   │
│  │ expiresAt        │   │
│  └──────────────────┘   │
│                          │
│  ┌──────────────────┐   │
│  │ user_roles       │   │
│  ├──────────────────┤   │
│  │ userId (FK)      │   │
│  │ roleId (FK)      │   │
│  └──────────────────┘   │
│           │              │
│           │ N:M          │
│           ↓              │
│  ┌──────────────────┐   │
│  │ roles            │   │
│  ├──────────────────┤   │
│  │ id               │   │
│  │ name             │   │
│  │ permissions      │   │
│  └──────────────────┘   │
└──────────────────────────┘

┌─────────────────────┐
│  content_types      │
├─────────────────────┤
│ id                  │──┐
│ name                │  │
│ slug (unique)       │  │
│ description         │  │
│ fields (JSON)       │  │
│ options (JSON)      │  │
└─────────────────────┘  │
                         │ 1:N
                         │
                         ↓
                ┌─────────────────┐
                │  contents       │
                ├─────────────────┤
                │ id              │
                │ contentTypeId   │
                │ title           │
                │ slug (unique)   │
                │ data (JSON)     │
                │ authorId (FK)   │
                │ status          │
                └─────────────────┘
                         │
                         │ 1:N
                         ↓
                ┌─────────────────────┐
                │ content_versions    │
                ├─────────────────────┤
                │ id                  │
                │ contentId (FK)      │
                │ version             │
                │ data (JSON)         │
                └─────────────────────┘

┌──────────────────┐
│  pages           │
├──────────────────┤
│ id               │
│ title            │
│ path (unique)    │
│ layout           │
│ blocks (JSON)    │
│ status           │
└──────────────────┘

┌──────────────────┐
│  media           │
├──────────────────┤
│ id               │
│ filename         │
│ path             │
│ mimeType         │
│ size             │
│ uploadedBy (FK)  │
└──────────────────┘
```

### Enum 타입

- **UserType**: `ADMIN`, `EDITOR`, `VIEWER`
- **ContentStatus**: `DRAFT`, `PUBLISHED`, `SCHEDULED`, `ARCHIVED`
- **PageStatus**: `DRAFT`, `PUBLISHED`, `ARCHIVED`

---

## 인증 및 권한 시스템

### JWT 토큰 기반 인증

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /auth/login
       │    { email, password }
       ↓
┌─────────────────────┐
│  Auth Controller    │
└──────┬──────────────┘
       │ 2. 검증 요청
       ↓
┌─────────────────────┐
│   Auth Service      │
│                     │
│  ① 사용자 조회      │
│  ② 비밀번호 검증    │
│  ③ JWT 토큰 생성    │
└──────┬──────────────┘
       │ 3. 토큰 반환
       │    { accessToken, refreshToken }
       ↓
┌─────────────┐
│   Client    │
│ (토큰 저장)  │
└──────┬──────┘
       │ 4. 이후 모든 API 요청
       │    Header: Authorization: Bearer {accessToken}
       ↓
┌─────────────────────┐
│  JWT Auth Guard     │
│                     │
│  ① 토큰 추출        │
│  ② 토큰 검증        │
│  ③ 사용자 정보 추가 │
└──────┬──────────────┘
       │ 5. 인증된 요청
       ↓
┌─────────────────────┐
│  Protected API      │
└─────────────────────┘
```

### 토큰 종류

| 토큰 | 유효기간 | 용도 |
|------|---------|------|
| **Access Token** | 1시간 | API 요청 인증 |
| **Refresh Token** | 7일 | Access Token 갱신 |

### 인증 플로우

1. **로그인**: 이메일/비밀번호 → Access Token + Refresh Token 발급
2. **API 요청**: `Authorization: Bearer {accessToken}` 헤더 포함
3. **토큰 검증**: JwtAuthGuard가 자동으로 검증
4. **로그아웃**: Refresh Token 삭제

---

## API 구조

### 현재 구현된 API (Stage 1-5)

#### 1. Auth API (`/auth`)

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/auth/register` | ❌ | 회원가입 |
| POST | `/auth/login` | ❌ | 로그인 |
| POST | `/auth/logout` | ✅ | 로그아웃 |
| GET | `/auth/me` | ✅ | 현재 사용자 정보 |

**예시: 로그인**
```typescript
// 요청
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 응답
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm...",
    "email": "user@example.com",
    "name": "홍길동"
  }
}
```

#### 2. Content Type API (`/content-types`)

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/content-types` | ✅ | 콘텐츠 타입 생성 |
| GET | `/content-types` | ✅ | 전체 목록 조회 |
| GET | `/content-types/:id` | ✅ | 단일 조회 |
| PATCH | `/content-types/:id` | ✅ | 수정 |
| DELETE | `/content-types/:id` | ✅ | 삭제 |

**예시: 콘텐츠 타입 생성**
```typescript
// 요청
POST /content-types
Authorization: Bearer {accessToken}
{
  "name": "블로그 포스트",
  "slug": "blog-post",
  "description": "블로그 게시글",
  "fields": {
    "title": { "type": "string", "required": true },
    "content": { "type": "text", "required": true }
  },
  "options": {
    "icon": "article"
  }
}

// 응답
{
  "id": "cmkqmfvs30000rcui4qbx7jlb",
  "name": "블로그 포스트",
  "slug": "blog-post",
  ...
}
```

### API 문서 (Swagger)

**모든 API는 Swagger UI에서 확인 가능합니다:**
- URL: `http://localhost:3000/api-docs`
- 각 API의 요청/응답 형식, 예시, 테스트 기능 제공

---

## 모듈 의존성

### 의존성 그래프

```
AppModule (루트)
├── ConfigModule (전역)
│   └── 환경 변수 관리
│
├── PrismaModule (전역)
│   └── 데이터베이스 연결
│
├── AuthModule
│   ├── PrismaModule (주입)
│   ├── JwtModule (주입)
│   ├── PassportModule (주입)
│   └── ConfigModule (주입)
│
└── ContentTypeModule
    └── PrismaModule (주입)
```

### 모듈별 역할

#### 1. ConfigModule
- **역할**: 환경 변수 관리 및 검증
- **전역**: ✅ (모든 모듈에서 접근 가능)
- **주요 기능**:
  - `.env` 파일 로드
  - 환경 변수 타입 검증
  - 구조화된 설정 제공
  - `CMS_EDITION` 환경변수 관리 (에디션별 기능 분기의 기준)

#### 2. PrismaModule
- **역할**: 데이터베이스 연결 관리
- **전역**: ✅
- **주요 기능**:
  - Prisma Client 생성 및 관리
  - DB 연결/해제 생명주기 관리
  - 트랜잭션 지원

#### 3. AuthModule
- **역할**: 사용자 인증 및 권한 관리
- **의존성**: PrismaModule, JwtModule, PassportModule
- **주요 기능**:
  - 회원가입/로그인
  - JWT 토큰 발급 및 검증
  - 비밀번호 암호화

#### 4. ContentTypeModule
- **역할**: 콘텐츠 타입 CRUD
- **의존성**: PrismaModule
- **주요 기능**:
  - 콘텐츠 타입 생성/조회/수정/삭제
  - slug 중복 검증
  - 참조 무결성 확인

---

## 전역 설정

### ValidationPipe (전역)
```typescript
// 모든 요청에 대해 DTO 검증 수행
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // DTO에 없는 필드 제거
    forbidNonWhitelisted: true, // 허용되지 않은 필드 있으면 에러
    transform: true,            // 타입 자동 변환
  }),
);
```

### AllExceptionsFilter (전역)
```typescript
// 모든 예외를 일관된 형식으로 응답
{
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request",
  "timestamp": "2026-01-23T...",
  "path": "/api/endpoint"
}
```

### CORS 설정
```typescript
// 허용된 출처에서만 API 접근 가능
origin: [
  'http://localhost:5173',  // Admin Panel
  'http://localhost:5174',  // Public Site
]
```

---

## 보안 고려사항

### 1. 비밀번호 보안
- **bcrypt 해싱**: salt rounds 10
- 평문 비밀번호는 절대 저장하지 않음

### 2. JWT 보안
- **Secret Key**: 환경 변수로 관리 (`.env`)
- **만료 시간**: Access Token 1시간, Refresh Token 7일
- **Bearer Token**: HTTP Header로 전송

### 3. SQL Injection 방지
- **Prisma ORM**: 자동으로 SQL Injection 방지
- 파라미터화된 쿼리 사용

### 4. XSS 방지
- **DTO Validation**: 입력값 검증
- **whitelist**: 허용된 필드만 처리

---

## 향후 개발 예정 (Phase별)

### Phase A — Starter/Business 핵심 기능

- [ ] Content 모듈 (실제 콘텐츠 CRUD) `[Starter+]`
- [ ] Media 모듈 (파일 업로드/관리) `[Starter+]`
- [ ] Role & Permission 모듈 (세밀한 권한 관리) `[Starter+]`
- [ ] Notification 모듈 (알림) `[Starter+]`
- [ ] Search 모듈 (검색) `[Starter+]`
- [ ] Page 모듈 (페이지 빌더) `[Business]`
- [ ] Template 모듈 (페이지/콘텐츠 템플릿) `[Business]`
- [ ] Component 모듈 (커스텀 컴포넌트) `[Business]`
- [ ] GraphQL API (REST API와 병행) `[Starter+]`

### Phase A+C — Enterprise 기능

- [ ] Workflow 모듈 (콘텐츠 승인 시스템) `[Enterprise]`
- [ ] InternalComment 모듈 (편집자 간 피드백) `[Enterprise]`
- [ ] Audit Log Dashboard (감사 로그 강화) `[Enterprise]`
- [ ] SSO 모듈 (SAML/OIDC 연동) `[Enterprise]`
- [ ] MultiSite 모듈 (멀티사이트 운영) `[Enterprise]`
- [ ] FieldPermission 모듈 (필드 레벨 권한) `[Enterprise]`
- [ ] API Analytics 모듈 (API 사용량 분석) `[Enterprise]`

### Phase B — 버티컬 SaaS (Phase A 완성 후 결정)

- [ ] 산업 특화 모듈 (프랜차이즈/부동산/교육/의료 중 1개 선택)

---

## 개발 가이드

### 새로운 모듈 추가 시 체크리스트

1. [ ] 모듈 폴더 생성 (`src/{module-name}/`)
2. [ ] DTO 작성 (validation 포함)
3. [ ] Service 작성 (비즈니스 로직)
4. [ ] Controller 작성 (API 엔드포인트)
5. [ ] Module 작성 (의존성 주입)
6. [ ] AppModule에 import
7. [ ] **Swagger 데코레이터 추가** (`@ApiTags`, `@ApiOperation`, `@ApiProperty`)
8. [ ] API 테스트
9. [ ] ai_log.md 업데이트
10. [ ] Git 커밋

### Swagger 데코레이터 예시
```typescript
// DTO
@ApiProperty({
  example: 'example value',
  description: '설명',
})

// Controller
@ApiTags('태그명')
@ApiOperation({ summary: '요약', description: '상세 설명' })
@ApiResponse({ status: 200, description: '성공' })
@ApiBearerAuth('access-token') // 인증 필요한 경우
```

---

## 참고 문서

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Prisma 공식 문서](https://www.prisma.io/docs)
- [Swagger/OpenAPI 문서](https://swagger.io/specification/)
- [프로젝트 기획서](./project.md)
- [백엔드 명세](./backend.md)
