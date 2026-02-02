# 백엔드 기술 명세 (Backend Specification)

이 문서는 백엔드 구현에 필요한 기술적 세부 사항을 정의한다.

> **에디션 표기**: 기능/모듈 옆의 `[Starter+]` `[Business]` `[Enterprise]` 태그는
> 해당 기능이 활성화되는 최소 에디션을 나타낸다.
> 환경변수 `CMS_EDITION` (`starter` | `business` | `enterprise`)으로 제어한다.

---

## 1. 인증/보안 (Authentication & Security)

### 1.1 인증 방식

**JWT (JSON Web Token)** 기반 인증을 사용한다.

```
┌─────────────────────────────────────────────────────┐
│                    로그인 요청                        │
│                  (이메일 + 비밀번호)                   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              서버에서 2개 토큰 발급                    │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │  Access Token   │  │     Refresh Token       │   │
│  │  (짧은 수명)     │  │     (긴 수명)            │   │
│  └─────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                   클라이언트 저장                     │
│  Access Token → 메모리 (변수)                        │
│  Refresh Token → HttpOnly Cookie                    │
└─────────────────────────────────────────────────────┘
```

### 1.2 토큰 설정

| 항목 | 설정값 | 설명 |
|------|--------|------|
| **Access Token 만료** | 1시간 | API 요청 시 사용 |
| **Refresh Token 만료** | 7일 | Access Token 갱신용 |
| **Access Token 저장** | 메모리 | XSS 공격 방지 |
| **Refresh Token 저장** | HttpOnly Cookie | JavaScript 접근 불가 |

### 1.3 토큰 갱신 플로우

```
1. 클라이언트가 API 요청 (Access Token 포함)
2. Access Token 만료 시 → 401 응답
3. 클라이언트가 /auth/refresh 호출 (Refresh Token 자동 전송 - Cookie)
4. 서버가 새 Access Token 발급
5. 원래 요청 재시도
```

### 1.4 관리자/회원 통합 인증

관리자와 회원은 **동일한 인증 시스템**을 사용하고, `userType` 필드로 구분한다.

| userType | 설명 | 접근 가능 |
|----------|------|-----------|
| `admin` | 관리자 | Admin Panel + Public Site |
| `member` | 일반 회원 | Public Site |

### 1.5 비밀번호 정책

| 항목 | 설정 |
|------|------|
| 해싱 알고리즘 | bcrypt |
| 솔트 라운드 | 10 |
| 최소 길이 | 8자 |
| 복잡성 | 영문 + 숫자 권장 (강제하지 않음) |

### 1.6 권한 검증 (NestJS Guard)

```
권한 검증 순서
1. JwtAuthGuard      → 토큰 유효성 검사 및 사용자 컨텍스트 주입
2. PermissionsGuard  → 사용자의 역할 권한 확인 (OR 기반)
```

#### 권한 형식

`resource:action` 패턴을 사용한다. 와일드카드 지원:

| 형식 | 예시 | 의미 |
|------|------|------|
| `*` | `*` | 모든 리소스, 모든 액션 |
| `resource:*` | `content:*` | 특정 리소스의 모든 액션 |
| `resource:action` | `content:read` | 특정 리소스의 특정 액션 |

#### 권한 확인 방식 (OR 기반)

사용자가 가진 역할 중 **하나라도** 필요한 권한을 포함하면 접근 허용된다.

```typescript
// 예: @Permissions('role:create', '*')
// → 사용자의 역할 중 role:create 또는 * 권한을 가진 역할이 있으면 통과
```

#### 기본 역할 및 권한

| 역할 | 권한 |
|------|------|
| **super-admin** | `*` (모든 권한) |
| **admin** | `content-type:*`, `content:*`, `media:*`, `user:read`, `role:read` |
| **editor** | `content:read`, `content:create`, `content:update`, `content-type:read`, `media:read`, `media:create`, `media:update` |
| **viewer** | `content:read`, `content-type:read`, `media:read` |

#### 엔드포인트별 필요 권한

| 영역 | 엔드포인트 | 필요 권한 |
|------|-----------|-----------|
| **Roles** | POST /roles | `role:create`, `*` |
| | GET /roles | `role:read`, `role:*`, `*` |
| | PATCH /roles/:id | `role:update`, `role:*`, `*` |
| | DELETE /roles/:id | `role:delete`, `role:*`, `*` |
| **User Roles** | POST /user-roles/request | 인증 사용자 전원 |
| | GET /user-roles/requests/pending | `role:assign`, `*` |
| | POST /user-roles/requests/:id/approve | `role:assign`, `*` |
| | POST /user-roles/requests/:id/reject | `role:assign`, `*` |
| | GET /user-roles/users/:id/roles | `user:read`, `*` |
| | DELETE /user-roles/users/:id/roles/:roleId | `role:assign`, `*` |
| **Content Types** | POST /content-types | `content-type:create`, `content-type:*`, `*` |
| | GET /content-types | `content-type:read`, `content-type:*`, `*` |
| | PATCH /content-types/:id | `content-type:update`, `content-type:*`, `*` |
| | DELETE /content-types/:id | `content-type:delete`, `content-type:*`, `*` |
| **Contents** | POST /contents | `content:create`, `content:*`, `*` |
| | GET /contents | `content:read`, `content:*`, `*` |
| | PATCH /contents/:id | `content:update`, `content:*`, `*` |
| | DELETE /contents/:id | `content:delete`, `content:*`, `*` |
| **Media** | POST /media/upload | `media:create`, `media:*`, `*` |
| | GET /media | `media:read`, `media:*`, `*` |
| | PATCH /media/:id | `media:update`, `media:*`, `*` |
| | DELETE /media/:id | `media:delete`, `media:*`, `*` |
| **Media Folders** | POST /media/folders | `media:create`, `media:*`, `*` |
| | GET /media/folders | `media:read`, `media:*`, `*` |
| | PATCH /media/folders/:id | `media:update`, `media:*`, `*` |
| | DELETE /media/folders/:id | `media:delete`, `media:*`, `*` |

#### 역할 요청 워크플로

```
사용자                          관리자(role:assign)
  │                                  │
  │  POST /user-roles/request        │
  │  {"roleId": "..."}               │
  │ ──────────────────────────►      │
  │          PENDING                 │
  │                                  │
  │                    GET /requests/pending
  │                                  │
  │          POST /requests/:id/approve  │
  │          └─ status → ACTIVE          │
  │          POST /requests/:id/reject   │
  │          └─ status → REJECTED        │
  │                                  │
```

- REJECTED 상태의 역할은 다시 요청 가능 (기존 레코드를 PENDING으로 초기화)
- ACTIVE 중인 역할은 중복 요청 불가 (409)
- 대기 중인 요청이 있으면 중복 요청 불가 (409)

---

## 2. 콘텐츠 타입 시스템 (Content Type System)

### 2.1 필드 타입 목록

사용자가 콘텐츠 타입을 정의할 때 선택할 수 있는 필드 타입:

#### 기본 필드

| 필드 타입 | 코드 | 설명 | DB 타입 |
|-----------|------|------|---------|
| 한 줄 텍스트 | `text` | 짧은 텍스트 | VARCHAR(255) |
| 여러 줄 텍스트 | `textarea` | 긴 텍스트 | TEXT |
| 리치 텍스트 | `richtext` | WYSIWYG 에디터 | TEXT |
| 숫자 (정수) | `integer` | 정수 | INTEGER |
| 숫자 (소수) | `decimal` | 소수점 | DECIMAL |
| 불리언 | `boolean` | true/false | BOOLEAN |
| 날짜 | `date` | 날짜만 | DATE |
| 날짜+시간 | `datetime` | 날짜와 시간 | TIMESTAMP |
| 이메일 | `email` | 이메일 형식 | VARCHAR(255) |
| URL | `url` | URL 형식 | VARCHAR(500) |

#### 선택 필드

| 필드 타입 | 코드 | 설명 | DB 타입 |
|-----------|------|------|---------|
| 단일 선택 | `select` | 드롭다운 (1개 선택) | VARCHAR(100) |
| 다중 선택 | `multiselect` | 체크박스 (여러 개 선택) | JSON |
| 라디오 | `radio` | 라디오 버튼 | VARCHAR(100) |

#### 미디어 필드

| 필드 타입 | 코드 | 설명 | DB 타입 |
|-----------|------|------|---------|
| 이미지 | `image` | 단일 이미지 | INTEGER (FK) |
| 이미지 갤러리 | `images` | 여러 이미지 | JSON |
| 파일 | `file` | 단일 파일 | INTEGER (FK) |
| 파일 목록 | `files` | 여러 파일 | JSON |

#### 관계 필드

| 필드 타입 | 코드 | 설명 | DB 타입 |
|-----------|------|------|---------|
| 관계 (1:1) | `relation_one` | 단일 연결 | INTEGER (FK) |
| 관계 (1:N) | `relation_many` | 다중 연결 | 중간 테이블 |

#### 특수 필드

| 필드 타입 | 코드 | 설명 | DB 타입 |
|-----------|------|------|---------|
| JSON | `json` | 자유 형식 데이터 | JSONB |
| 슬러그 | `slug` | URL 식별자 (자동 생성) | VARCHAR(255) |
| 색상 | `color` | 색상 선택 (#RRGGBB) | VARCHAR(7) |

### 2.2 필드 옵션

모든 필드에 공통으로 적용되는 옵션:

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `required` | 필수 여부 | false |
| `unique` | 고유값 여부 | false |
| `default` | 기본값 | null |
| `private` | API 노출 여부 | false |
| `localized` | 다국어 지원 여부 | false |

필드 타입별 추가 옵션:

| 필드 타입 | 옵션 | 설명 |
|-----------|------|------|
| `text`, `textarea` | `minLength`, `maxLength` | 글자 수 제한 |
| `integer`, `decimal` | `min`, `max` | 숫자 범위 |
| `select`, `multiselect` | `options` | 선택 항목 목록 |
| `image`, `images` | `allowedTypes` | 허용 확장자 |
| `file`, `files` | `maxSize` | 최대 파일 크기 |

### 2.3 관계 타입

| 관계 | 설명 | 예시 |
|------|------|------|
| **1:1** | 하나의 콘텐츠가 하나와 연결 | 게시글 - 작성자 |
| **1:N** | 하나의 콘텐츠가 여러 개와 연결 | 카테고리 - 게시글들 |
| **N:N** | 여러 콘텐츠가 서로 연결 | 게시글 - 태그들 |

---

## 3. 데이터베이스 설계 (Database Design)

### 3.1 동적 콘텐츠 저장 방식

**하이브리드 방식**: 메타 테이블 + JSONB

```
┌─────────────────────────────────────────────────────┐
│                 content_types                        │
│  콘텐츠 타입 정의 (게시글, 상품 등)                    │
├─────────────────────────────────────────────────────┤
│  id, name, slug, fields(JSONB), settings(JSONB)     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                    contents                          │
│  실제 콘텐츠 데이터                                   │
├─────────────────────────────────────────────────────┤
│  id, content_type_id, data(JSONB), status,          │
│  created_at, updated_at, published_at               │
└─────────────────────────────────────────────────────┘
```

### 3.2 왜 이 방식인가?

| 방식 | 장점 | 단점 |
|------|------|------|
| **동적 테이블 생성** | 쿼리 빠름 | 구현 복잡, 마이그레이션 어려움 |
| **EAV 패턴** | 유연함 | 쿼리 매우 복잡 |
| **JSONB (선택)** | 구현 단순, 유연함 | 인덱싱 제한적 |

**JSONB 방식 선택 이유:**
- PostgreSQL의 JSONB는 인덱싱 지원
- Prisma에서 JSON 타입 지원
- 구현이 단순하여 초보자도 이해 가능
- 충분한 성능 (대부분의 CMS 규모에서)

### 3.3 핵심 테이블 구조

```sql
-- 사용자 (관리자 + 회원 통합)
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
├── user_type (admin | member)
├── status (active | inactive | blocked)
├── created_at
└── updated_at

-- 역할
roles
├── id (PK)
├── name
├── slug (UNIQUE)
├── permissions (JSONB)
└── created_at

-- 사용자-역할 연결
user_roles
├── user_id (FK)
└── role_id (FK)

-- 콘텐츠 타입 정의
content_types
├── id (PK)
├── name
├── slug (UNIQUE)
├── description
├── fields (JSONB)        -- 필드 정의
├── settings (JSONB)      -- 추가 설정
└── created_at

-- 콘텐츠
contents
├── id (PK)
├── content_type_id (FK)
├── data (JSONB)          -- 실제 데이터
├── status (draft | review | approved | published)
├── author_id (FK)
├── locale                 -- 언어 코드
├── version               -- 버전 번호
├── published_at
├── scheduled_at          -- 예약 발행
├── expired_at            -- 발행 종료
├── created_at
└── updated_at

-- 콘텐츠 버전 히스토리
content_versions
├── id (PK)
├── content_id (FK)
├── version
├── data (JSONB)
├── changed_by (FK)
└── created_at

-- 미디어
media
├── id (PK)
├── filename
├── original_name
├── mime_type
├── size
├── path
├── folder_id (FK)
├── thumbnails (JSONB)    -- 썸네일 경로들
├── uploaded_by (FK)
└── created_at

-- 미디어 폴더
media_folders
├── id (PK)
├── name
├── parent_id (FK, self)
└── created_at

-- 페이지
pages
├── id (PK)
├── title
├── slug (UNIQUE)
├── type (main | static | dynamic | system)
├── content (JSONB)       -- 페이지 빌더 데이터
├── template_id (FK)
├── seo (JSONB)
├── status
├── locale
└── created_at

-- 알림
notifications
├── id (PK)
├── user_id (FK)
├── type
├── title
├── message
├── data (JSONB)
├── read_at
└── created_at

-- 감사 로그
audit_logs
├── id (PK)
├── user_id (FK)
├── action (create | update | delete | publish)
├── entity_type
├── entity_id
├── old_data (JSONB)
├── new_data (JSONB)
├── ip_address
└── created_at
```

### 3.4 JSONB 필드 예시

**content_types.fields 예시:**
```json
[
  {
    "name": "title",
    "type": "text",
    "label": "제목",
    "required": true,
    "localized": true
  },
  {
    "name": "content",
    "type": "richtext",
    "label": "내용",
    "required": true
  },
  {
    "name": "category",
    "type": "relation_one",
    "label": "카테고리",
    "target": "categories"
  }
]
```

**contents.data 예시:**
```json
{
  "title": "첫 번째 게시글",
  "content": "<p>내용입니다...</p>",
  "category": 5
}
```

---

## 4. API 설계 (API Design)

### 4.1 REST API 규칙

**기본 URL 구조:**
```
/api/v1/{resource}
```

**엔드포인트 규칙:**

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/contents/:type` | 목록 조회 |
| GET | `/api/v1/contents/:type/:id` | 상세 조회 |
| POST | `/api/v1/contents/:type` | 생성 |
| PUT | `/api/v1/contents/:type/:id` | 전체 수정 |
| PATCH | `/api/v1/contents/:type/:id` | 부분 수정 |
| DELETE | `/api/v1/contents/:type/:id` | 삭제 |

**예시:**
```
GET    /api/v1/contents/posts          # 게시글 목록
GET    /api/v1/contents/posts/123      # 게시글 상세
POST   /api/v1/contents/posts          # 게시글 생성
PUT    /api/v1/contents/posts/123      # 게시글 수정
DELETE /api/v1/contents/posts/123      # 게시글 삭제
```

### 4.2 응답 형식

**성공 응답:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "제목은 필수입니다.",
    "details": [
      { "field": "title", "message": "필수 입력 항목입니다." }
    ]
  }
}
```

### 4.3 쿼리 파라미터

| 파라미터 | 설명 | 예시 |
|----------|------|------|
| `page` | 페이지 번호 | `?page=2` |
| `limit` | 페이지당 개수 | `?limit=20` |
| `sort` | 정렬 | `?sort=-created_at` (- = DESC) |
| `filter` | 필터링 | `?filter[status]=published` |
| `search` | 검색 | `?search=키워드` |
| `locale` | 언어 | `?locale=ko` |
| `populate` | 관계 포함 | `?populate=author,category` |

### 4.4 GraphQL (선택사항)

기본은 REST API이고, GraphQL은 추후 확장으로 제공.

```graphql
query {
  posts(limit: 10, status: "published") {
    id
    title
    content
    author {
      name
    }
  }
}
```

### 4.5 API 인증

| API 유형 | 인증 방식 |
|----------|-----------|
| Admin API | JWT (Access Token) |
| Public API | API Key (헤더: `X-API-Key`) |

---

## 5. 파일 저장소 (File Storage)

### 5.1 저장 방식

**로컬 저장** (기본) + **클라우드 확장 가능**

```
uploads/
├── images/
│   ├── original/      # 원본
│   ├── thumbnails/    # 썸네일
│   │   ├── sm/        # 150x150
│   │   ├── md/        # 300x300
│   │   └── lg/        # 600x600
│   └── webp/          # WebP 변환본
├── files/
└── temp/              # 임시 파일
```

### 5.2 이미지 처리 파이프라인

```
업로드 → 유효성 검사 → 원본 저장 → 썸네일 생성 → WebP 변환 → DB 저장
```

| 단계 | 처리 내용 |
|------|-----------|
| 유효성 검사 | 파일 타입, 크기 제한 |
| 원본 저장 | 원본 유지 |
| 썸네일 생성 | sm(150), md(300), lg(600) |
| WebP 변환 | 용량 최적화 |

### 5.3 파일 제한

| 항목 | 제한 |
|------|------|
| 이미지 최대 크기 | 10MB |
| 파일 최대 크기 | 50MB |
| 허용 이미지 형식 | jpg, jpeg, png, gif, webp |
| 허용 파일 형식 | pdf, doc, docx, xls, xlsx, zip |

---

## 6. 오픈소스 라이브러리 (백엔드)

### 6.1 이미지 처리 — Sharp `[Starter+]`

| 항목 | 내용 |
|------|------|
| 버전 | 0.34.x |
| 라이선스 | Apache-2.0 |
| 용도 | Media 모듈 이미지 처리 파이프라인 |

**처리 흐름:**
```
업로드 → 유효성 검사 → 원본 저장 → Sharp 파이프라인 → DB 저장
                                      ├── 썸네일 생성 (sm/md/lg)
                                      ├── WebP 변환
                                      └── 메타데이터 추출
```

### 6.2 비동기 작업 큐 — BullMQ `[Starter+]`

| 항목 | 내용 |
|------|------|
| 버전 | 11.x |
| 라이선스 | MIT |
| NestJS 연동 | @nestjs/bullmq |
| 요구사항 | Redis 6.2.0+ |

**큐 대상 작업:**
- 이미지 리사이즈/변환 (Sharp 비동기 처리)
- 예약 발행 실행
- Webhook 발송 (실패 시 재시도)
- Import/Export 대량 처리

### 6.3 크론 작업 — @nestjs/schedule `[Starter+]`

| 항목 | 내용 |
|------|------|
| 버전 | 6.x |
| 라이선스 | MIT |
| 유지보수 | NestJS 공식 패키지 |

**크론 대상:**
- 예약 발행 체크 (1분 간격)
- 휴지통 자동 비우기 (일간)
- 자동 백업 (설정에 따라 일간/주간)
- 임시 파일 정리

### 6.4 Rate Limiting — @nestjs/throttler `[Starter+]`

| 항목 | 내용 |
|------|------|
| 버전 | 6.5.x |
| 라이선스 | MIT |

| API 유형 | 제한 |
|----------|------|
| Public API | 100 요청/분 |
| Admin API | 300 요청/분 |
| 로그인 시도 | 5회/분 (실패 시) |

### 6.5 HTML Sanitize — isomorphic-dompurify `[Starter+]`

| 항목 | 내용 |
|------|------|
| 버전 | 2.x |
| 라이선스 | MIT |
| 용도 | richtext 필드 저장 시 XSS 방지 |

TipTap 에디터에서 입력된 HTML을 DB에 저장하기 전 서버에서 sanitize 처리.
User Site에서 `dangerouslySetInnerHTML`로 렌더링하므로 필수.

### 6.6 검색 엔진 — MeiliSearch `[Starter+]`

| 항목 | 내용 |
|------|------|
| 버전 | 1.19.x |
| 라이선스 | MIT (Community) |
| NestJS 연동 | nestjs-meilisearch |

**SearchEngine 인터페이스 패턴**으로 추상화하여 설계한다.
향후 자체 검색엔진으로 교체 시 구현체만 교체하면 된다.

```typescript
// search/interfaces/search-engine.interface.ts
interface SearchEngine {
  indexDocument(index: string, id: string, document: any): Promise<void>;
  search(index: string, query: string, options?: SearchOptions): Promise<SearchResult>;
  deleteDocument(index: string, id: string): Promise<void>;
  createIndex(index: string, options?: IndexOptions): Promise<void>;
}
```

### 6.7 기타 백엔드 라이브러리

| 라이브러리 | 용도 | 라이선스 | 우선순위 |
|-----------|------|---------|---------|
| **Nodemailer** | 이메일 발송 (알림, 비밀번호 재설정) | MIT | 중간 |
| **SheetJS (xlsx)** | CSV/Excel Import/Export | Apache-2.0 | 중간 |
| **archiver** | 백업 ZIP 생성 | MIT | 낮음 |

---

## 7. 캐싱 및 성능 (Caching & Performance)

### 7.1 캐싱 전략

**초기 버전**: 인메모리 캐싱 (NestJS Cache Manager)
**확장**: Redis (대규모 트래픽 시, BullMQ 도입과 함께)

| 캐시 대상 | TTL | 무효화 시점 |
|-----------|-----|-------------|
| 콘텐츠 목록 | 5분 | 생성/수정/삭제 시 |
| 콘텐츠 상세 | 10분 | 수정/삭제 시 |
| 콘텐츠 타입 정의 | 1시간 | 수정 시 |
| 페이지 | 10분 | 수정 시 |

---

## 8. NestJS 모듈 구조 (Module Structure)

### 에디션별 모듈 분기

`AppModule`에서 `CMS_EDITION` 환경변수를 확인하여 조건부로 모듈을 import 한다.
단일 코드베이스에서 에디션별로 기능 범위를 제어하는 방식이다.

```typescript
// app.module.ts (개념)
const edition = process.env.CMS_EDITION || 'starter';

const coreModules = [AuthModule, ContentTypeModule, ContentModule, MediaModule, RoleModule, ...];
const businessModules = edition !== 'starter' ? [PageModule, TemplateModule, ComponentModule] : [];
const enterpriseModules = edition === 'enterprise' ? [WorkflowModule, InternalCommentModule, SsoModule, MultiSiteModule, ...] : [];

@Module({ imports: [...coreModules, ...businessModules, ...enterpriseModules] })
```

### 모듈 목록

```
src/
├── modules/
│   ├── auth/            # 인증/인가 [Starter+]
│   ├── users/           # 사용자 관리 [Starter+]
│   ├── roles/           # 역할/권한 [Starter+]
│   ├── content-types/   # 콘텐츠 타입 정의 [Starter+]
│   ├── contents/        # 콘텐츠 CRUD [Starter+]
│   ├── media/           # 미디어 관리 [Starter+]
│   ├── notifications/   # 알림 [Starter+]
│   ├── audit/           # 감사 로그 (기본) [Starter+]
│   ├── settings/        # 시스템 설정 [Starter+]
│   ├── pages/           # 페이지 관리 [Business]
│   ├── templates/       # 템플릿 관리 [Business]
│   ├── components/      # 컴포넌트 관리 [Business]
│   ├── workflow/        # 승인 워크플로우 [Enterprise]
│   ├── internal-comment/# 내부 댓글/메모 [Enterprise]
│   ├── sso/             # SSO 연동 [Enterprise]
│   ├── multi-site/      # 멀티사이트 [Enterprise]
│   └── api-analytics/   # API 분석 [Enterprise]
├── common/
│   ├── guards/          # 인증/권한 Guard
│   ├── decorators/      # 커스텀 데코레이터
│   ├── filters/         # 예외 필터
│   ├── interceptors/    # 인터셉터
│   └── pipes/           # 유효성 검사 Pipe
├── config/              # 설정 파일
└── prisma/              # Prisma 스키마
```

---

## 9. 에러 코드 (Error Codes)

| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 입력값 오류 |
| `DUPLICATE_ENTRY` | 409 | 중복 데이터 |
| `RATE_LIMIT_EXCEEDED` | 429 | 요청 제한 초과 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

---

## 10. 환경 변수 (Environment Variables)

```env
# 서버
PORT=3000
NODE_ENV=development

# 에디션 (starter | business | enterprise)
CMS_EDITION=starter

# 데이터베이스
DATABASE_URL=postgresql://user:password@localhost:5432/cms

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# 파일 업로드
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800

# 캐시 (선택)
REDIS_URL=redis://localhost:6379
```

### 에디션별 환경변수 설명

| 변수 | 값 | 설명 |
|------|------|------|
| `CMS_EDITION` | `starter` | Headless CMS (API + Admin Panel) |
| | `business` | + User Site + Page Builder |
| | `enterprise` | + Workflow, SSO, MultiSite 등 |

에디션은 **상위 호환**: `enterprise`는 `business`의 모든 기능을 포함하고, `business`는 `starter`의 모든 기능을 포함한다.
