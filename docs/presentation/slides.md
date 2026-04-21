---
marp: true
theme: default
paginate: true
size: 16:9
transition: fade
style: |
  section {
    font-family: 'Noto Sans KR', system-ui, sans-serif;
    background: #f8fafc;
    color: #0f172a;
  }
  section.cover {
    background: linear-gradient(135deg, #1e293b 0%, #334155 60%, #4f46e5 100%);
    color: #f8fafc;
    text-align: center;
    justify-content: center;
  }
  section.cover h1 {
    font-size: 72px;
    letter-spacing: -0.03em;
    margin-bottom: 8px;
  }
  section.cover p {
    font-size: 24px;
    opacity: 0.85;
  }
  section.section-break {
    background: #0f172a;
    color: #f8fafc;
    text-align: center;
    justify-content: center;
  }
  section.section-break h1 {
    font-size: 80px;
    color: #818cf8;
  }
  h1 {
    color: #1e293b;
    border-bottom: 3px solid #4f46e5;
    padding-bottom: 8px;
  }
  h2 { color: #334155; }
  h3 { color: #4f46e5; }
  strong { color: #4f46e5; }
  table {
    font-size: 20px;
  }
  th {
    background-color: #e0e7ff;
    color: #1e1b4b;
  }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    margin-right: 4px;
  }
  .badge-starter { background: #10b981; color: white; }
  .badge-business { background: #3b82f6; color: white; }
  .badge-enterprise { background: #8b5cf6; color: white; }
  .badge-pro { background: #f59e0b; color: white; }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .callout {
    padding: 16px 20px;
    background: #eef2ff;
    border-left: 4px solid #4f46e5;
    border-radius: 8px;
    margin-top: 16px;
  }
  .animate-in {
    animation: fadeInUp 0.6s ease-out;
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
---

<!-- _class: cover -->

# Starter CMS

### 빈 도화지에서 시작하는 확장형 헤드리스 CMS 플랫폼

<br>

2026-04-21 · 사내 발표

---

# 오늘 이야기할 것

1. **프로젝트 배경과 의의** — 왜 이걸 만들었나
2. **제품 구조** — Starter · Business · Enterprise · Professional
3. **Starter 현황** — 개발 완료된 16개 기능
4. **기술 스택과 아키텍처**
5. **실제 기능 시연** (화면 공유)
6. **장점과 한계, 향후 로드맵**

---

<!-- _class: section-break -->

# 1. 배경과 의의

---

# 왜 만들었나 — 기존 SI 모델의 문제

<div class="columns">

<div>

### 기존 방식
- 고객마다 **처음부터** 개발
- 반복 기능(로그인/권한/CRUD)에 **공수 낭비**
- 요구사항 늘어날수록 유지보수 부담 증가
- "비슷한 걸 또 만들고 있다"는 피로감

</div>

<div>

### 우리의 방향
- **공통 CMS 플랫폼**을 한 번 만들어두고
- 고객 요구에 맞게 **에디션/확장**으로 대응
- **빈 도화지** 컨셉 — 사전 정의된 스키마 없음
- 콘텐츠 폼을 **사용자가 직접 정의**

</div>

</div>

---

# 프로젝트 목적

<div class="callout">
SI 프로젝트에서 반복되는 CMS/어드민 구축 비용을 최소화하고,<br>
고객사에 <strong>빠르게 납품 + 안정적으로 운영</strong>할 수 있는 플랫폼 확보
</div>

### 세 가지 목표

1. **재사용 가능한 공통 기반** — 매번 다시 만들지 않는다
2. **고객 맞춤 확장성** — 에디션/모듈 단위로 조합
3. **헤드리스 구조** — 어떤 프론트엔드든 연동 가능 (웹/앱/키오스크 등)

---

<!-- _class: section-break -->

# 2. 제품 구조

---

# 에디션 구성

<br>

| 에디션 | 대상 고객 | 제공 범위 |
|---|---|---|
| <span class="badge badge-starter">Starter</span> | 개발팀 있는 기업 | API + Admin Panel (헤드리스) |
| <span class="badge badge-business">Business</span> | 페이지 자체 구축 원하는 기업 | Starter + 페이지 빌더 + 다국어 + SEO |
| <span class="badge badge-enterprise">Enterprise</span> | 대기업 / 멀티 브랜드 | Business + 멀티사이트 + SSO + 승인 워크플로우 |
| <span class="badge badge-pro">Professional</span> | 특수 요구 고객 | 모든 에디션 + 맞춤형 기능 개발 |

<br>

### 핵심 전략
> **점진적 확장** — Starter 고객도 추후 Business/Enterprise로 승급 가능

---

# Starter <span class="badge badge-starter">현재 완성</span>

**타겟**: 개발팀을 보유한 기업 / 헤드리스 CMS가 필요한 곳

### 제공하는 가치
- 콘텐츠 관리 어드민 패널
- REST API 자동 생성
- 권한 / 미디어 / 검색 / 감사 / 알림 등 운영 필수 기능 일체

### 적합한 케이스
- 자체 앱/웹이 있고 콘텐츠만 관리할 곳이 필요한 고객
- 개발자가 API로 직접 통합
- 빠른 POC가 필요한 프로젝트

---

# Business

**타겟**: 고객사 내부 비개발자가 페이지까지 구성하고 싶은 경우

### 추가되는 것
- **페이지 빌더** — 드래그앤드롭으로 페이지 구성 (Craft.js 기반)
- **다국어(i18n)** — 콘텐츠 언어별 버전 관리
- **SEO 관리** — 메타태그, OG, sitemap
- **실시간 미리보기** — 편집과 동시에 확인
- **템플릿/컴포넌트 라이브러리**

---

# Enterprise

**타겟**: 대기업, 여러 브랜드/사이트를 하나의 시스템으로 운영

### 추가되는 것
- **멀티사이트** — 하나의 설치로 여러 사이트 + 사이트별 독립 설정
- **SSO** — SAML/OAuth 기반 사내 계정 통합
- **승인 워크플로우** — 초안 → 검토 → 승인 → 발행
- **필드 레벨 권한** — 민감 필드 별도 권한 제어

---

# Professional

**고객사 맞춤 기능** 을 요구하는 특수 케이스

- 기존 에디션 위에 **고객 전용 모듈** 추가 개발
- 우리 CMS를 내부 프레임워크처럼 활용
- 라이선스·운영 모델은 고객과 협의

---

<!-- _class: section-break -->

# 3. Starter 개발 현황

---

# 구현 완료된 16개 기능

<div class="columns">

<div>

### 콘텐츠 관리
- ✅ 콘텐츠 폼 CRUD (동적 스키마)
- ✅ 콘텐츠 폼 카테고리 (그룹핑)
- ✅ 콘텐츠 CRUD + 버전 관리
- ✅ 예약 발행 / 콘텐츠 보관
- ✅ 휴지통 (Soft delete)
- ✅ Import/Export (CSV/JSON)
- ✅ 검색 (MeiliSearch)

</div>

<div>

### 운영 / 통합
- ✅ 역할 기반 세밀 권한
- ✅ 미디어 관리 + 이미지 최적화
- ✅ 실시간 알림 (WebSocket)
- ✅ 감사 로그
- ✅ Webhook (Slack/Discord 호환)
- ✅ 백업/복원 (DB + 파일 ZIP)
- ✅ 시스템 설정
- ✅ API 가이드 + API 키 관리
- ✅ 회원 인증

</div>

</div>

---

# API 규모

<br>

| 모듈 | API 수 |
|---|---|
| Auth / Role / UserRole | 17 |
| ContentForm / FormCategory / Content | 20 |
| Media / MediaFolder | 12 |
| Settings / AuditLog / Webhook / Backup / Notification | 24 |
| ApiKey / Search / Import-Export / PublicAPI / Email | 30+ |
| **합계** | **약 100개 + 크론 3개** |

<div class="callout">
모든 엔드포인트는 <strong>Swagger로 자동 문서화</strong>되고, 어드민 내 <strong>API 가이드 페이지</strong>에서 복사·테스트 가능
</div>

---

# 이번 스프린트 주요 업데이트

### 이번 주 개선사항 (2026-04-15 ~ 04-21)

- ✨ **FormCategory** 도입 — 콘텐츠 폼을 카테고리별로 그룹핑
- 🎨 **콘텐츠 관리 허브** 분리 — 작업 맥락 분리 (루트 / 콘텐츠 허브)
- 🔁 **용어 통일** — 사용자 친화 "콘텐츠 폼"으로 전수 리네이밍 (ContentType → ContentForm)
- 🛡️ **Import 스키마 검증** — 잘못된 폼으로 데이터 유입 차단
- 🧩 **수정 폼 안정화** — 외부 데이터와 폼 상태 동기화 이슈 해결

---

<!-- _class: section-break -->

# 4. 기술 스택 · 아키텍처

---

# 기술 스택

<div class="columns">

<div>

### 백엔드
- **NestJS** (TypeScript) — 모듈화 + 엔터프라이즈급
- **Prisma 7.x** + PostgreSQL (JSONB)
- **BullMQ** 비동기 작업 큐
- **Sharp** 이미지 처리
- **MeiliSearch** 검색
- **@nestjs/throttler** Rate Limit

</div>

<div>

### 프론트엔드
- **React 19** + **Vite**
- **Tailwind CSS v4** + **shadcn/ui**
- **TanStack Query** 서버 상태
- **React Hook Form** + **Zod**
- **@dnd-kit** 드래그앤드롭
- **TipTap** 리치 텍스트

</div>

</div>

<br>

### 라이선스
모든 핵심 라이브러리 **MIT / Apache-2.0** — 상업적 제약 없음

---

# 아키텍처 개요

```
┌──────────────────┐     ┌──────────────────┐
│   Admin Panel    │     │  Public Frontend │
│  (React + Vite)  │     │  (Next.js/SPA)   │
└────────┬─────────┘     └────────┬─────────┘
         │  Admin API             │  Public API
         │  (JWT)                 │  (API Key)
         ▼                        ▼
    ┌────────────────────────────────┐
    │    NestJS Backend              │
    │  ┌──────────────────────────┐  │
    │  │ ContentForm / Content    │  │
    │  │ Media / User / Role      │  │
    │  │ Webhook / AuditLog       │  │
    │  └──────────────────────────┘  │
    └──┬──────────┬───────────┬──────┘
       │          │           │
       ▼          ▼           ▼
  PostgreSQL  MeiliSearch  File Storage
```

---

# 헤드리스 CMS의 핵심 특징

- **백엔드 / 프론트엔드 완전 분리** — 어떤 프론트도 연동 가능
- **콘텐츠 스키마를 사용자가 정의** — "빈 도화지"
- **API 키로 외부 앱 인증** — 공개 API 별도 제공
- **멀티 채널 배포 준비** — 웹, 앱, IoT, 키오스크 등 하나의 CMS에서 운영

---

<!-- _class: section-break -->

# 5. 실제 기능 시연

---

# 시연 흐름 (약 15분)

<br>

1. **콘텐츠 폼 만들기** — 빈 스키마에서 시작해서 "공지사항" 폼 생성
2. **카테고리와 그룹핑** — 카테고리 만들고 콘텐츠 폼 묶기
3. **콘텐츠 작성 + 발행 + 예약 발행**
4. **미디어 업로드 + 이미지 자동 최적화**
5. **역할/권한** — 뷰어 계정으로 재로그인하여 차이 확인
6. **API 가이드** — 외부 개발자 관점, cURL 복사 → 실제 호출
7. **실시간 알림** — 다른 탭에서 변경 → 알림 벨 즉시 반영
8. **Import / Export + 백업 복원**

> **화면 공유로 진행합니다**

---

<!-- _class: section-break -->

# 6. 장단점과 로드맵

---

# Starter의 강점

### 우리 제품이 잘하는 것

- **빠른 투입** — 신규 SI에 기본 구축 공수 대폭 절감
- **빈 도화지** — 특정 업종에 묶이지 않는 범용성
- **헤드리스** — 웹/앱/키오스크 어디든 붙일 수 있음
- **운영 필수 기능 기본 탑재** — 감사/알림/Webhook/백업까지
- **한국어 친화** — MeiliSearch 한국어 검색, UI 전부 한국어

---

# 현재의 한계 (솔직 평가)

### 아직 부족한 것
- **다국어(i18n) 미지원** — Business 에디션에서 제공 예정
- **페이지 빌더 없음** — 헤드리스 초점, Business에서 보완
- **실시간 미리보기 없음** — Business에서 제공
- **운영 규모 검증** — 실제 대규모 트래픽 검증 필요
- **E2E 테스트 커버리지** — 수동 QA 중심, 자동화 확충 필요

### 초기 도입 시 고려사항
- 외부 프론트엔드가 API를 직접 다뤄야 함 (개발팀 필수)
- 커스텀 UI가 필요한 경우 Business 이상 고려

---

# 로드맵

<br>

| 단계 | 시기 | 주요 내용 |
|---|---|---|
| <span class="badge badge-starter">Starter 안정화</span> | 진행 중 | 품질·성능·접근성 다듬기, 문서 정비, 배포 절차 |
| <span class="badge badge-business">Business 착수</span> | 다음 스프린트 | 페이지 빌더(Craft.js) · 다국어 · SEO |
| <span class="badge badge-enterprise">Enterprise</span> | 이후 | 멀티사이트 · SSO · 승인 워크플로우 |
| <span class="badge badge-pro">Professional</span> | 상시 | 고객 맞춤 모듈 개발 |

---

# 정리

<div class="callout">

### 이번 발표의 핵심

1. **Starter 에디션이 완성**되어 사내 표준 헤드리스 CMS 기반이 준비됐습니다
2. 기획 기준 **16개 기능, API 약 100개** 구현 완료
3. 다음은 **Business 에디션** — 페이지 빌더 · 다국어 · SEO 방향으로 확장

</div>

<br>

### 피드백/협업 제안

- 실제 투입 가능한 **POC 고객사 추천**
- **Business에서 우선 구현했으면 하는 기능** 의견
- QA / 성능 테스트 도움 주실 분

---

<!-- _class: cover -->

# 감사합니다

### 질문과 피드백 환영합니다

<br>

저장소 · 문서: 내부 링크 참조
