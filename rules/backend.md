# 백엔드 기술 명세 (Backend Specification)

이 문서는 백엔드 구현에 필요한 기술적 세부 사항을 정의한다.

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

```typescript
// 권한 검증 순서
1. JwtAuthGuard    → 토큰 유효성 검사
2. RolesGuard      → 역할(Role) 확인
3. PermissionGuard → 세부 권한 확인 (선택)
```

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

## 6. 캐싱 및 성능 (Caching & Performance)

### 6.1 캐싱 전략

**초기 버전**: 인메모리 캐싱 (NestJS Cache Manager)
**확장**: Redis (대규모 트래픽 시)

| 캐시 대상 | TTL | 무효화 시점 |
|-----------|-----|-------------|
| 콘텐츠 목록 | 5분 | 생성/수정/삭제 시 |
| 콘텐츠 상세 | 10분 | 수정/삭제 시 |
| 콘텐츠 타입 정의 | 1시간 | 수정 시 |
| 페이지 | 10분 | 수정 시 |

### 6.2 Rate Limiting

| API 유형 | 제한 |
|----------|------|
| Public API | 100 요청/분 |
| Admin API | 300 요청/분 |
| 로그인 시도 | 5회/분 (실패 시) |

---

## 7. NestJS 모듈 구조 (Module Structure)

```
src/
├── modules/
│   ├── auth/           # 인증/인가
│   ├── users/          # 사용자 관리
│   ├── roles/          # 역할/권한
│   ├── content-types/  # 콘텐츠 타입 정의
│   ├── contents/       # 콘텐츠 CRUD
│   ├── pages/          # 페이지 관리
│   ├── media/          # 미디어 관리
│   ├── notifications/  # 알림
│   ├── audit/          # 감사 로그
│   └── settings/       # 시스템 설정
├── common/
│   ├── guards/         # 인증/권한 Guard
│   ├── decorators/     # 커스텀 데코레이터
│   ├── filters/        # 예외 필터
│   ├── interceptors/   # 인터셉터
│   └── pipes/          # 유효성 검사 Pipe
├── config/             # 설정 파일
└── prisma/             # Prisma 스키마
```

---

## 8. 에러 코드 (Error Codes)

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

## 9. 환경 변수 (Environment Variables)

```env
# 서버
PORT=3000
NODE_ENV=development

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
