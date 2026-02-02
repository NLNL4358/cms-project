# 프론트엔드 기술 명세

이 문서는 CMS 프론트엔드의 기술적 구현 방향을 정의한다.

> **에디션 표기**: `[Starter+]` `[Business]` `[Enterprise]` 태그는 해당 기능이 활성화되는 최소 에디션을 나타낸다.
> 프론트엔드는 백엔드의 `/config/edition` API 또는 환경변수를 통해 현재 에디션을 확인하고,
> 메뉴/라우트/UI를 에디션에 맞게 동적으로 제어한다.

---

## ⚠️ 핵심 아키텍처 결정사항

### 1. React Compiler 사용 (수동 메모이제이션 금지)
- **절대 사용 금지:** `useMemo`, `useCallback`, `React.memo`
- React Compiler가 자동으로 최적화를 수행합니다.
- 컴포넌트와 훅은 일반적인 방식으로 작성하면 됩니다.

### 2. Context Provider 패턴 (Zustand 사용 안 함)
- **상태 관리:** Context API + useState + localStorage
- **Provider 구조:**
  - `PopupProvider`: 팝업/로딩 스피너 전역 상태 관리
  - `APIProvider`: Axios 인스턴스 제공 (모든 API 요청의 단일 진입점)
  - `UserProvider`: 인증 상태 관리 (useState + localStorage)
  - `GlobalProvider`: 전역 서버 데이터 캐싱 (TanStack Query)

### 3. tokenRef 패턴 (순환 의존성 해결)
- APIProvider와 UserProvider 간 순환 의존성을 모듈 레벨 ref로 해결
- `tokenRef.current = { accessToken, refresh, logout }`
- APIProvider 인터셉터는 tokenRef에서 토큰을 읽고
- UserProvider는 tokenRef를 업데이트

### 4. 모든 API 요청은 APIProvider 경유
- 컴포넌트/훅에서 `useAPI()` 사용
- 정적 import로 axios 인스턴스 가져오기 금지
- 모든 요청이 인터셉터를 거치도록 보장

### 5. JavaScript 사용 (TypeScript 아님)
- 프로젝트 전체를 JavaScript로 작성
- TypeScript는 사용하지 않습니다.

### 6. Tailwind CSS + Shadcn/ui 사용
- Tailwind CSS v4 + Shadcn/ui 기반 UI 컴포넌트 시스템
- Shadcn/ui 컴포넌트는 `src/components/ui/`에 복사되어 프로젝트 코드로 관리
- 기존 CSS 변수 시스템 (reset.css)과 Tailwind/Shadcn CSS 변수가 공존

### 7. PopupContext + popupRef 패턴 (자동 로딩 스피너)
- PopupProvider: 팝업/로딩 스피너 전역 상태 관리
- popupRef: tokenRef와 동일한 패턴으로 APIProvider 인터셉터에서 참조
- 모든 API 요청 시 자동으로 로딩 스피너 표시/숨김

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [상태 관리](#3-상태-관리)
4. [API 통신](#4-api-통신)
5. [인증 처리](#5-인증-처리)
6. [라우팅](#6-라우팅)
7. [UI 컴포넌트](#7-ui-컴포넌트)
8. [페이지 빌더](#8-페이지-빌더)
9. [폼 관리](#9-폼-관리)
10. [다국어 (i18n)](#10-다국어-i18n)
11. [성능 최적화](#11-성능-최적화)

---

## 1. 기술 스택

### 핵심 기술

| 기술       | 버전   | 용도                       |
| ---------- | ------ | -------------------------- |
| **React**  | 19.2.x | UI 라이브러리 (Compiler)   |
| **Vite**   | 7.x    | 빌드 도구 (빠른 개발 서버) |

> JavaScript를 사용합니다 (TypeScript 아님). React Compiler가 자동 메모이제이션을 제공합니다.

### 주요 라이브러리

| 라이브러리          | 용도                 | 선정 이유                      |
| ------------------- | -------------------- | ------------------------------ |
| **React Router**    | 라우팅               | React 표준, 안정적             |
| **TanStack Query**  | 서버 상태 관리       | 캐싱, 자동 재요청, 에러 처리   |
| **React Hook Form** | 폼 관리              | 성능 최적화, 유효성 검사       |
| **Zod**             | 스키마 검증          | 스키마 기반 런타임 검증 |
| **Axios**           | HTTP 클라이언트      | 인터셉터, 에러 처리            |

### UI 라이브러리

| 라이브러리       | 용도                        |
| ---------------- | --------------------------- |
| **Tailwind CSS** | 유틸리티 CSS 프레임워크 (v4) |
| **Shadcn/ui**    | Radix 기반 UI 컴포넌트 (코드 소유) |
| **Lucide React** | 아이콘                      |
| **Sonner**       | 토스트 알림                 |

> Shadcn/ui 컴포넌트는 node_modules가 아닌 프로젝트 코드(`src/components/ui/`)로 관리됩니다.

### 데이터/유틸리티 라이브러리

| 라이브러리                | 용도                            | 라이선스 |
| ------------------------- | ------------------------------- | -------- |
| **@tanstack/react-table** | 데이터 테이블 (목록 페이지)     | MIT      |
| **date-fns**              | 날짜 포매팅/파싱 (한국어 지원)  | MIT      |

### 페이지 빌더 관련 `[Business]`

| 라이브러리                 | 용도                  | 라이선스 |
| -------------------------- | --------------------- | -------- |
| **Craft.js**               | 페이지 빌더 엔진      | MIT      |
| **@dnd-kit**               | 드래그 앤 드롭        | MIT      |
| **react-resizable-panels** | 패널 리사이즈         | MIT      |

### 리치 텍스트 에디터 `[Starter+]`

| 라이브러리    | 용도                       | 라이선스    |
| ------------- | -------------------------- | ----------- |
| **TipTap**    | richtext 필드 에디터       | MIT (Core)  |

> TipTap Core(무료, MIT)만 사용. Pro 확장(협업 편집, AI 등)은 현재 불필요.

---

## 2. 프로젝트 구조

### 앱 분리

Admin Panel과 Public Site를 **모노레포** 구조로 관리한다.

```
frontend/
├── admin/          # Admin Panel (관리자 페이지)
├── user/           # Public Site (사용자 페이지, 미구현)
└── shared/         # 공유 코드 (현재 비어있음, 필요시 사용 검토)
```

루트 `pnpm-workspace.yaml`에 `frontend/*`를 포함시켜 각 폴더를 독립 패키지로 관리합니다.

> **참고:** 현재는 `shared` 폴더를 사용하지 않습니다. workspace 패키지 간 참조가 복잡하여 필요 시 재검토 예정입니다.

### 패키지별 구조 (Admin Panel)

```
admin/
├── src/
│   ├── App.jsx                 # 루트 컴포넌트 (라우팅 설정)
│   ├── main.jsx                # 앱 진입점 (Provider 중첩: Query > Router > Popup > API > User > Global)
│   │
│   ├── Providers/              # Context Providers (useState 기반)
│   │   ├── PopupContext.jsx    # 팝업/로딩 스피너 전역 상태 (popupRef 패턴)
│   │   ├── APIContext.jsx      # Axios 인스턴스 + 인터셉터 (tokenRef + popupRef 패턴)
│   │   ├── UserContext.jsx     # 인증 상태 (login, logout, refresh, localStorage persist)
│   │   └── GlobalContext.jsx   # 전역 서버 데이터 (contentTypes, isMobile, sidebarOpen)
│   │
│   ├── hooks/                  # 커스텀 훅
│   │   └── use-mobile.js      # 모바일 감지 (Shadcn Sidebar 의존)
│   │
│   ├── lib/                    # 유틸리티 모듈
│   │   ├── query-client.js     # TanStack Query 클라이언트 설정
│   │   └── utils.js            # cn() 유틸리티 (Shadcn/ui)
│   │
│   ├── Pages/                  # 페이지 컴포넌트
│   │   ├── System/             # 시스템 필수 페이지
│   │   │   └── Login.jsx       # 로그인 페이지 (구현 완료)
│   │   ├── Router/             # 섹션별 라우터 (Outlet 래퍼)
│   │   │   ├── ContentTypeRouter.jsx
│   │   │   ├── ContentRouter.jsx
│   │   │   ├── MediaRouter.jsx
│   │   │   └── RoleRouter.jsx
│   │   ├── Dashboard/          # 대시보드 (플레이스홀더)
│   │   ├── ContentType/        # 콘텐츠 타입 관리 (플레이스홀더)
│   │   ├── Content/            # 콘텐츠 관리 (플레이스홀더)
│   │   ├── Media/              # 미디어 관리 (플레이스홀더)
│   │   └── Role/               # 역할/권한 관리 (플레이스홀더)
│   │
│   ├── Components/             # 공통 컴포넌트
│   │   ├── features/           # 기능 컴포넌트
│   │   │   └── AuthGuard.jsx   # 인증 가드 (라우트 보호)
│   │   ├── layout/             # 레이아웃 컴포넌트 (구현 완료)
│   │   │   ├── AdminLayout.jsx # 관리자 레이아웃 (Sidebar + Header + Outlet)
│   │   │   ├── AppSidebar.jsx  # 사이드바 (고정메뉴 + 동적 콘텐츠 메뉴)
│   │   │   └── AppHeader.jsx   # 헤더 (브레드크럼 + 모바일 햄버거)
│   │   ├── ui/                 # Shadcn/ui 컴포넌트 (25개)
│   │   └── common/             # 공통 컴포넌트 (예정)
│   │
│   ├── Assets/                 # 정적 리소스
│   │   ├── images/             # 이미지 파일
│   │   └── icons/              # 아이콘 파일
│   │
│   └── CSS/                    # 스타일시트
│       ├── index.css           # Tailwind + Shadcn CSS 변수 + 레이아웃/사이드바/팝업 스타일
│       └── reset.css           # CSS 리셋 + CSS 변수 정의
│
├── index.html
├── vite.config.js              # Vite 설정 (alias + Tailwind 플러그인)
├── jsconfig.json               # import alias 설정 (Shadcn/ui 필수)
├── components.json             # Shadcn/ui 설정
└── package.json
```

### Vite 절대경로 설정

상대경로 대신 절대경로를 사용하여 import 경로를 간결하게 유지합니다.

**vite.config.js:**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['react-compiler'],
      },
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@pages', replacement: path.resolve(__dirname, 'src/Pages') },
    ],
  },
})
```

**사용 예시:**

```javascript
// ❌ 상대경로 (사용하지 않음)
import { AuthGuard } from '../../Components/features/AuthGuard.jsx';
import Login from '../../Pages/System/Login.jsx';

// ✅ 절대경로 (권장)
import { AuthGuard } from '@/Components/features/AuthGuard.jsx';
import Login from '@pages/System/Login.jsx';
```

**Alias 규칙:**
- `@/` → `src/` (모든 src 하위 경로)
- `@pages/` → `src/Pages/` (Pages 폴더 전용)

### main.jsx 구현 (Provider 중첩)

**실제 구현된 코드:**

```javascript
// src/main.jsx
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client.js';
import { UserProvider } from '@/Providers/UserContext.jsx';
import { APIProvider } from '@/Providers/APIContext.jsx';
import { GlobalProvider } from '@/Providers/GlobalContext.jsx';
import { PopupProvider } from '@/Providers/PopupContext.jsx';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <PopupProvider>
                <APIProvider>
                    <UserProvider>
                        <GlobalProvider>
                            <App />
                        </GlobalProvider>
                    </UserProvider>
                </APIProvider>
            </PopupProvider>
        </BrowserRouter>
    </QueryClientProvider>,
);
```

**Provider 중첩 순서 및 이유:**

1. **QueryClientProvider** (최상위)
   - TanStack Query 필수 Provider
   - 모든 `useQuery`, `useMutation` 훅이 작동하려면 필요
   - 의존성: 없음

2. **BrowserRouter**
   - React Router Provider
   - 모든 라우팅 관련 훅 (`useNavigate`, `useLocation` 등) 사용 가능하게 함
   - 의존성: 없음

3. **PopupProvider**
   - 팝업/로딩 스피너 전역 상태 관리
   - `usePopup()` 훅으로 makePopup, closePopup, makeProgressPopup, closeProgressPopup 제공
   - 의존성: 없음

4. **APIProvider**
   - Axios 인스턴스 생성 및 제공
   - `useAPI()` 훅으로 axios 인스턴스 접근 가능
   - `usePopup()` 사용 → PopupProvider에 의존 (popupRef 동기화)
   - 인터셉터가 `tokenRef`로 토큰 첨부, `popupRef`로 로딩 스피너 자동 표시
   - 의존성: PopupProvider

5. **UserProvider**
   - 인증 상태 관리 (user, accessToken, refreshToken)
   - `useAPI()` 사용 → APIProvider에 의존
   - `tokenRef.current` 업데이트
   - 의존성: APIProvider

6. **GlobalProvider** (최하위)
   - 전역 서버 데이터 캐싱 (contentTypes 등)
   - `useAPI()` + `useUser()` 사용 → APIProvider, UserProvider에 의존
   - `enabled: !!user && !!accessToken`로 로그인 + 토큰 보유 시에만 데이터 fetch
   - 의존성: APIProvider, UserProvider

### Feature 모듈 구조 (권장)

각 feature는 관련 코드를 함께 관리한다.

```
features/content/
├── api/                # API 호출 함수
│   └── content.api.js
├── hooks/              # 관련 훅
│   ├── useContents.js
│   └── useContentMutation.js
├── components/         # feature 전용 컴포넌트
│   ├── ContentList.jsx
│   ├── ContentForm.jsx
│   └── ContentCard.jsx
└── index.js            # 외부 export
```

---

## 3. 상태 관리

### 상태 분류

| 상태 유형           | 관리 도구       | 예시                     |
| ------------------- | --------------- | ------------------------ |
| **서버 상태**       | TanStack Query  | 콘텐츠 목록, 콘텐츠 타입 |
| **인증 상태**       | UserContext (useState + localStorage) | accessToken, user, refreshToken |
| **전역 서버 데이터**| GlobalContext (useQuery) | contentTypes 목록 |
| **폼 상태**         | React Hook Form | 입력값, 유효성 검사      |
| **URL 상태**        | React Router    | 필터, 페이지네이션       |

> **Context Provider 패턴을 사용합니다.** Zustand는 사용하지 않습니다.
> - APIContext: Axios 인스턴스 제공 (모든 API 요청은 이를 통해서만 수행)
> - UserContext: 인증 상태 관리 (useState + localStorage)
> - GlobalContext: 전역 서버 데이터 캐싱 (TanStack Query)

### Provider 중첩 구조

```javascript
// src/main.jsx
<QueryClientProvider client={queryClient}>  {/* TanStack Query 필수 */}
  <BrowserRouter>                           {/* React Router */}
    <PopupProvider>                         {/* 팝업/로딩 스피너 상태 */}
      <APIProvider>                         {/* Axios + popupRef 동기화 */}
        <UserProvider>                      {/* useAPI() 사용, tokenRef 업데이트 */}
          <GlobalProvider>                  {/* useAPI() + useUser() 사용 */}
            <App />
          </GlobalProvider>
        </UserProvider>
      </APIProvider>
    </PopupProvider>
  </BrowserRouter>
</QueryClientProvider>
```

**중첩 순서 이유:**
1. **QueryClientProvider**: `useQuery`, `useMutation` 사용을 위해 최상위 필수
2. **BrowserRouter**: 라우팅 컨텍스트 제공
3. **PopupProvider**: 팝업/스피너 상태 제공 (APIProvider가 `usePopup()` 사용)
4. **APIProvider**: axios 인스턴스 생성 + `usePopup()`으로 popupRef 동기화
5. **UserProvider**: `useAPI()`를 사용하므로 APIProvider 하위에 위치
6. **GlobalProvider**: `useAPI()`와 `useUser()`를 모두 사용하므로 가장 하위

### TanStack Query 설정

```javascript
// src/lib/query-client.js
import { QueryClient } from "@tanstack/react-query";

/**
 * TanStack Query 클라이언트 설정
 * - 서버 데이터 캐싱 및 자동 갱신 관리
 * - 모든 useQuery, useMutation이 이 설정을 상속
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5분간 캐시 신선 유지
      gcTime: 1000 * 60 * 30,          // 30분 후 캐시 메모리에서 제거
      retry: 1,                        // 실패 시 1회 재시도
      refetchOnWindowFocus: false,     // 포커스 시 자동 재요청 비활성화
    },
  },
});
```

### Query Key 규칙

```javascript
// 일관된 쿼리 키 구조 (권장)
export const queryKeys = {
  contents: {
    all: ["contents"],
    lists: () => [...queryKeys.contents.all, "list"],
    list: (params) => [...queryKeys.contents.lists(), params],
    detail: (id) => [...queryKeys.contents.all, "detail", id],
  },
  contentTypes: {
    all: ["content-types"],
    list: () => [...queryKeys.contentTypes.all, "list"],
    detail: (slug) => [...queryKeys.contentTypes.all, slug],
  },
};
```

### UserContext 구현 (인증 상태)

```javascript
// src/Providers/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAPI, tokenRef } from "./APIContext.jsx";

const UserContext = createContext();

export function UserProvider({ children }) {
  const api = useAPI();  // APIProvider의 axios 인스턴스 사용

  // localStorage에서 초기값 복원
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem("cms-admin-user");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [accessToken, setAccessToken] = useState(null);  // 메모리만 (보안)
  const [refreshToken, setRefreshToken] = useState(
    () => localStorage.getItem("cms-admin-refresh-token") || null
  );

  // localStorage 동기화
  useEffect(() => {
    if (user) localStorage.setItem("cms-admin-user", JSON.stringify(user));
    else localStorage.removeItem("cms-admin-user");
  }, [user]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem("cms-admin-refresh-token", refreshToken);
    else localStorage.removeItem("cms-admin-refresh-token");
  }, [refreshToken]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  };

  const refresh = async () => {
    if (!refreshToken) throw new Error("refreshToken 없음");
    const { data } = await api.post("/auth/refresh", { refreshToken });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // APIProvider 인터셉터가 참조할 수 있도록 tokenRef 동기화
  useEffect(() => {
    tokenRef.current = { accessToken, refresh, logout };
  }, [accessToken, refresh, logout]);

  return (
    <UserContext.Provider value={{ user, accessToken, login, logout, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
```

**핵심 포인트:**
- `accessToken`: 메모리만 유지 (새로고침 시 사라짐, 보안)
- `refreshToken`, `user`: localStorage 저장 (새로고침 후에도 로그인 유지)
- `useAPI()` 사용: 모든 API 요청을 APIProvider를 통해 수행
- `tokenRef.current` 업데이트: APIProvider의 인터셉터가 최신 토큰 참조

### GlobalContext 구현 (전역 서버 데이터 + 반응형 상태)

```javascript
// src/Providers/GlobalContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAPI } from "./APIContext.jsx";
import { useUser } from "./UserContext.jsx";

const MOBILE_BREAKPOINT = 768;
const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const api = useAPI();
  const { user, accessToken } = useUser();

  /** 반응형 — isMobile */
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /** 사이드바 열림/닫힘 (모바일 전용) */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  // 로그인된 사용자 + accessToken이 있을 때만 콘텐츠 타입 목록 조회
  const { data: contentTypes = [] } = useQuery({
    queryKey: ["content-types"],
    queryFn: () => api.get("/content-types").then((r) => r.data),
    enabled: !!user && !!accessToken,
  });

  return (
    <GlobalContext.Provider value={{ contentTypes, isMobile, sidebarOpen, setSidebarOpen }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  return useContext(GlobalContext);
}
```

**핵심 포인트:**
- `useQuery`로 서버 데이터 캐싱
- `enabled: !!user && !!accessToken`: user가 localStorage에 있어도 accessToken(메모리)이 없으면 API 호출 방지 → 새로고침 직후 401 에러 방지
- `useAPI()`, `useUser()` 사용: APIProvider와 UserProvider에 의존
- `isMobile`: 768px 이하 반응형 감지 (resize 이벤트)
- `sidebarOpen` / `setSidebarOpen`: 모바일 사이드바 토글 (데스크톱 전환 시 자동 닫힘)

---

## 4. API 통신

### APIContext 구현 (tokenRef 패턴)

**핵심 원칙:** 모든 API 요청은 APIProvider를 통해서만 수행합니다.

백엔드 API 경로에 접두사(`/api/v1`) 없이 직접 호출합니다.

```javascript
// src/Providers/APIContext.jsx
import React, { createContext, useContext, useEffect, createRef } from "react";
import axios from "axios";
import { usePopup } from "./PopupContext";

const APIContext = createContext();

// 모듈 레벨 ref — UserProvider에서 업데이트
export const tokenRef = createRef();
tokenRef.current = { accessToken: null, refresh: null, logout: null };

// 모듈 레벨 ref — PopupProvider에서 업데이트
export const popupRef = createRef();
popupRef.current = { makeProgressPopup: null, closeProgressPopup: null };

// 모듈 레벨에서 인스턴스를 한 번만 생성
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터 — 로딩 스피너 표시 + accessToken 첨부
instance.interceptors.request.use((config) => {
  if (popupRef.current?.makeProgressPopup) {
    popupRef.current.makeProgressPopup();
  }
  if (tokenRef.current.accessToken) {
    config.headers.Authorization = `Bearer ${tokenRef.current.accessToken}`;
  }
  return config;
});

// 응답 인터셉터 — 로딩 스피너 숨김 + 401 시 토큰 갱신 후 재시도
instance.interceptors.response.use(
  (response) => {
    if (popupRef.current?.closeProgressPopup) {
      popupRef.current.closeProgressPopup();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (tokenRef.current?.refresh && typeof tokenRef.current.refresh === 'function') {
        try {
          await tokenRef.current.refresh();
          originalRequest.headers.Authorization = `Bearer ${tokenRef.current.accessToken}`;
          return instance(originalRequest);
        } catch {
          if (tokenRef.current?.logout) tokenRef.current.logout();
          if (popupRef.current?.closeProgressPopup) popupRef.current.closeProgressPopup();
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } else {
        if (popupRef.current?.closeProgressPopup) popupRef.current.closeProgressPopup();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    if (popupRef.current?.closeProgressPopup) popupRef.current.closeProgressPopup();
    return Promise.reject(error);
  },
);

export function APIProvider({ children }) {
  const { makeProgressPopup, closeProgressPopup } = usePopup();

  useEffect(() => {
    popupRef.current = { makeProgressPopup, closeProgressPopup };
  }, [makeProgressPopup, closeProgressPopup]);

  return <APIContext.Provider value={instance}>{children}</APIContext.Provider>;
}

export function useAPI() {
  return useContext(APIContext);
}
```

**tokenRef + popupRef 패턴 설명:**

문제 1: UserContext는 APIProvider의 axios 인스턴스를 사용해야 하고, APIProvider의 인터셉터는 UserContext의 accessToken을 읽어야 함 → 순환 의존성
문제 2: API 요청 시 자동으로 로딩 스피너를 표시/숨김하려면, 인터셉터가 PopupContext에 접근해야 함

해결:
1. **tokenRef**: 모듈 레벨 ref로 APIProvider 인터셉터와 UserProvider 간 브릿지
2. **popupRef**: 동일한 패턴으로 APIProvider 인터셉터와 PopupProvider 간 브릿지
3. **APIProvider**: `usePopup()` 훅으로 popupRef 동기화 (useEffect)
4. **UserProvider**: `useAPI()`로 axios 인스턴스 사용, `tokenRef.current` 업데이트

**장점:**
- 순환 의존성 회피
- 모든 API 요청이 APIProvider를 거치도록 강제
- 모든 API 요청에 자동 로딩 스피너 적용
- 인터셉터에서 null-safe 접근 (초기 렌더링 시 함수 미등록 대비)

### API 함수 사용 패턴

**방법 1: 컴포넌트에서 직접 `useAPI()` 사용**

```javascript
// src/pages/content-type/ContentTypeListPage.jsx
import { useQuery } from "@tanstack/react-query";
import { useAPI } from "../../Providers/APIContext";

export function ContentTypeListPage() {
  const api = useAPI();

  const { data: contentTypes, isLoading } = useQuery({
    queryKey: ["content-types"],
    queryFn: () => api.get("/content-types").then((r) => r.data),
  });

  // ...
}
```

**방법 2: API 함수 분리 (권장 - 재사용성)**

```javascript
// src/features/content-type/api.js
// API 함수는 axios 인스턴스를 인자로 받음
export const contentTypeApi = {
  getAll: (api) => api.get("/content-types").then((r) => r.data),
  getById: (api, id) => api.get(`/content-types/${id}`).then((r) => r.data),
  create: (api, dto) => api.post("/content-types", dto).then((r) => r.data),
  update: (api, id, dto) => api.patch(`/content-types/${id}`, dto).then((r) => r.data),
  delete: (api, id) => api.delete(`/content-types/${id}`),
};
```

```javascript
// src/hooks/useContentTypes.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAPI } from "../Providers/APIContext";
import { contentTypeApi } from "../features/content-type/api";

export function useContentTypes() {
  const api = useAPI();
  return useQuery({
    queryKey: ["content-types"],
    queryFn: () => contentTypeApi.getAll(api),
  });
}

export function useCreateContentType() {
  const api = useAPI();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto) => contentTypeApi.create(api, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-types"] });
    },
  });
}
```

**핵심 포인트:**
- API 함수는 `useAPI()` 훅으로 얻은 axios 인스턴스를 사용
- 정적 import로 axios를 가져오지 않음 (tokenRef 패턴 유지)
- TanStack Query 훅에서 `api` 인스턴스를 주입하여 사용

---

## 5. 인증 처리

### 인증 상태 관리

**UserContext** (Section 3 참조)를 사용하여 인증 상태를 관리합니다.

백엔드 응답: `{ accessToken, refreshToken, user: { id, email, name, type, isActive } }`

**데이터 저장 위치:**
- `accessToken`: 메모리만 유지 (새로고침 시 사라짐) → 보안
- `refreshToken`: localStorage 저장 → 페이지 새로고침 후 재인증 가능
- `user`: localStorage 저장 → 앱 초기화 시 로그인 상태 복원

**자동 토큰 갱신:**
APIProvider의 응답 인터셉터가 401 에러 시 자동으로 토큰 갱신 후 재시도합니다.

```javascript
// 401 에러 처리 흐름 (APIContext.jsx 내부)
1. API 요청 → 401 에러 발생
2. tokenRef.current.refresh() 호출 → UserContext의 refresh 함수 실행
3. 새로운 accessToken, refreshToken 획득
4. tokenRef.current.accessToken 업데이트
5. 원래 요청에 새 토큰 첨부하여 재시도
6. 성공 시 정상 응답 반환
7. 실패 시 tokenRef.current.logout() → /login 리다이렉트
```

### 인증 가드

**실제 구현된 코드:**

```javascript
// src/Components/features/AuthGuard.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/Providers/UserContext.jsx';

export function AuthGuard({ children }) {
  const { user } = useUser();
  const location = useLocation();

  if (!user) {
    // 로그인하지 않은 경우 /login으로 리다이렉트
    // 리다이렉트 전 경로를 state로 전달 (로그인 후 원래 페이지로 복귀)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

**핵심 포인트:**
- `useUser()`로 로그인 상태 확인
- 비로그인 시 `/login`으로 리다이렉트
- 현재 경로를 `state`로 전달하여 로그인 후 복귀 가능

### 로그인 페이지 예시

```javascript
// src/pages/login/LoginPage.jsx
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../../Providers/UserContext";

export function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm();

  const from = location.state?.from?.pathname || "/";

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });  // 로그인 후 원래 경로로 복귀
    } catch (error) {
      alert("로그인 실패: " + error.message);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("email")} type="email" placeholder="이메일" />
      <input {...form.register("password")} type="password" placeholder="비밀번호" />
      <button type="submit">로그인</button>
    </form>
  );
}
```

### 로그아웃 예시

```javascript
import { useUser } from "../../Providers/UserContext";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header>
      <span>{user?.name}</span>
      <button onClick={handleLogout}>로그아웃</button>
    </header>
  );
}
```

---

## 6. 라우팅

### 라우터 설정 (현재 구현)

**App.jsx:**

```javascript
// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "@/Components/features/AuthGuard.jsx";
import AdminLayout from "@/Components/layout/AdminLayout.jsx";
import Login from "@pages/System/Login.jsx";
import Dashboard from "@pages/Dashboard/Dashboard.jsx";
// ... 섹션별 라우터 및 플레이스홀더 페이지 import

function App() {
  return (
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/login" element={<Login />} />

      {/* 보호된 라우트 — AdminLayout (Sidebar + Header + Outlet) */}
      <Route path="/" element={<AuthGuard><AdminLayout /></AuthGuard>}>
        <Route index element={<Dashboard />} />
        <Route path="content-types" element={<ContentTypeRouter />}>
          <Route index element={<ContentTypeList />} />
        </Route>
        <Route path="contents/:contentTypeSlug" element={<ContentRouter />}>
          <Route index element={<ContentList />} />
        </Route>
        <Route path="media" element={<MediaRouter />}>
          <Route index element={<MediaList />} />
        </Route>
        <Route path="roles" element={<RoleRouter />}>
          <Route index element={<RoleList />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

**라우팅 구조:**
1. **공개 라우트**: `/login` - 로그인 페이지 (누구나 접근 가능)
2. **보호된 라우트**: `AuthGuard` + `AdminLayout`으로 감싸진 nested routes
   - `/` - 대시보드
   - `/content-types` - 콘텐츠 타입 관리
   - `/contents/:contentTypeSlug` - 동적 콘텐츠 목록 (GlobalContext의 contentTypes 기반)
   - `/media` - 미디어 관리
   - `/roles` - 역할/권한 관리
3. **Catch-all**: `*` → `/`로 리다이렉트

**AdminLayout 구조:**
- 헤더(AppHeader): 브레드크럼 + 모바일 햄버거 메뉴
- 사이드바(AppSidebar): 고정 메뉴 + 동적 콘텐츠 메뉴 (contentTypes에서 생성)
- 메인 콘텐츠: `<Outlet />`으로 자식 라우트 렌더링
- 모바일: 사이드바가 오른쪽 오버레이로 표시 (GlobalContext의 isMobile/sidebarOpen 제어)

**에디션별 라우트 제어 (향후):**
에디션에 따라 메뉴와 라우트를 동적으로 표시/숨김:
- `Starter`: 대시보드, 콘텐츠 타입, 콘텐츠, 미디어, 역할/권한
- `Business`: + 페이지 관리, 템플릿, 컴포넌트
- `Enterprise`: + 워크플로우, 감사 로그 대시보드, 멀티사이트

### URL 상태 관리

```typescript
// 필터/페이지네이션을 URL 파라미터로 관리
import { useSearchParams } from "react-router-dom";

export function useUrlParams<T extends Record<string, string>>() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = Object.fromEntries(searchParams.entries()) as T;

  const setParams = (newParams: Partial<T>) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          updated.delete(key);
        } else {
          updated.set(key, String(value));
        }
      });
      return updated;
    });
  };

  return [params, setParams] as const;
}
```

---

## 7. UI 컴포넌트

### shadcn/ui 사용

shadcn/ui는 복사해서 사용하는 컴포넌트 라이브러리이다.

```bash
# 컴포넌트 추가
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add dialog
```

### 컴포넌트 구조

```
src/components/
├── ui/                     # shadcn/ui 컴포넌트
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
│
├── layout/                 # 레이아웃 컴포넌트
│   ├── AdminLayout.tsx
│   ├── Sidebar.tsx
│   └── Header.tsx
│
└── common/                 # 공통 컴포넌트
    ├── DataTable.tsx       # 데이터 테이블
    ├── Pagination.tsx      # 페이지네이션
    ├── ConfirmDialog.tsx   # 확인 다이얼로그
    ├── FileUploader.tsx    # 파일 업로드
    └── SearchInput.tsx     # 검색 입력
```

### 공통 데이터 테이블

```typescript
// src/components/common/DataTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  onRowClick,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <table className="w-full">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row.original)}
            className="cursor-pointer hover:bg-gray-50"
          >
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 8. 콘텐츠 렌더링 (범용 데이터 렌더링)

백엔드의 콘텐츠는 **ContentType의 fields 배열**로 정의됩니다.
프론트엔드는 ComponentNode 트리가 아닌, **필드 타입별 렌더러 컴포넌트**를 사용하여 콘텐츠를 동적으로 렌더링합니다.

### 아키텍처 개요

```
백엔드 ContentType
└── fields: [{ name, type, label, required, options }, ...]

프론트엔드 렌더링
├── Admin (폼 에디터)     → 필드 타입별 입력 컴포넌트
└── User (공개 사이트)     → 필드 타입별 표시 컴포넌트
```

### 백엔드 필드 타입 목록

| 타입 | 설명 | 렌더러 예시 |
|---|---|---|
| `text` | 단일 행 텍스트 | `<input type="text">` / `<p>` |
| `textarea` | 다중 행 텍스트 | `<textarea>` / `<p>` |
| `richtext` | 리치 텍스트 | TipTap Editor / `dangerouslySetInnerHTML` |
| `integer` | 정수 | `<input type="number">` / `<span>` |
| `decimal` | 실수 | `<input type="number" step>` / `<span>` |
| `boolean` | 불리언 | `<input type="checkbox">` / 아이콘 |
| `date` | 날짜 | `<input type="date">` / 날짜 포맷 |
| `datetime` | 날짜+시간 | `<input type="datetime-local">` / 포맷 |
| `email` | 이메일 | `<input type="email">` / `<a mailto>` |
| `url` | URL | `<input type="url">` / `<a href>` |
| `select` | 단일 선택 | `<select>` / `<span>` |
| `multiselect` | 다중 선택 | 체크박스 그룹 / 태그 목록 |
| `radio` | 라디오 | 라디오 버튼 그룹 / `<span>` |
| `image` | 이미지 1개 | 이미지 피커 / `<img>` |
| `images` | 이미지 여러개 | 다중 이미지 피커 / 갤러리 |
| `file` | 파일 1개 | 파일 업로드 / 다운로드 링크 |
| `files` | 파일 여러개 | 다중 파일 업로드 / 파일 목록 |
| `relation_one` | 관계 1:1 | 검색 선택 피커 / 링크 |
| `relation_many` | 관계 1:N | 다중 검색 선택 / 태그 목록 |
| `json` | JSON | 코드 에디터 / 구조화 표시 |
| `slug` | URL 슬러그 | 자동 생성 입력 / `<code>` |
| `color` | 색상 | 컬러 피커 / 색상 스왑 |

### 동적 폼 렌더링 (Admin)

콘텐츠 타입의 `fields` 배열을 순회하며, 각 필드의 `type`에 따라 적절한 입력 컴포넌트를 렌더링합니다.

```javascript
// src/features/content/components/DynamicForm.jsx
import { useForm, Controller } from "react-hook-form";

// 필드 타입별 입력 컴포넌트 매핑
const fieldEditors = {
  text: TextInput,
  textarea: TextareaInput,
  richtext: RichTextInput,
  integer: NumberInput,
  boolean: CheckboxInput,
  select: SelectInput,
  image: ImagePickerInput,
  relation_one: RelationPickerInput,
  // ... 기타 타입
};

export function DynamicForm({ contentType, initialData, onSubmit }) {
  const form = useForm({ defaultValues: initialData ?? {} });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {contentType.fields.map((field) => {
        const Editor = fieldEditors[field.type];
        if (!Editor) return null; // 지원하지 않는 타입 건너뛰기

        return (
          <div key={field.name}>
            <label>{field.label}</label>
            <Controller
              name={field.name}
              control={form.control}
              rules={{ required: field.required }}
              render={({ field: formField }) => (
                <Editor
                  value={formField.value}
                  onChange={formField.onChange}
                  fieldDef={field}  // options 등 필드 정의 전달
                />
              )}
            />
          </div>
        );
      })}
      <button type="submit">저장</button>
    </form>
  );
}
```

### 동적 렌더링 (User / 공개 사이트)

같은 원리로, 필드 타입별 **표시 컴포넌트**를 사용합니다.

```javascript
// src/features/content/components/DynamicRenderer.jsx

const fieldRenderers = {
  text: ({ value }) => <p>{value}</p>,
  richtext: ({ value }) => <div dangerouslySetInnerHTML={{ __html: value }} />,
  image: ({ value }) => <img src={value.url} alt={value.alt} />,
  relation_one: ({ value }) => <a href={`/${value.slug}`}>{value.title}</a>,
  // ... 기타 타입
};

export function DynamicRenderer({ contentType, content }) {
  return (
    <article>
      {contentType.fields.map((field) => {
        const Renderer = fieldRenderers[field.type];
        if (!Renderer) return null;
        return (
          <section key={field.name}>
            <Renderer value={content[field.name]} fieldDef={field} />
          </section>
        );
      })}
    </article>
  );
}
```

### 확장성

새로운 필드 타입을 백엔드에 추가하면, 프론트에서는 해당 타입의 Editor와 Renderer 컴포넌트만 추가하면 됩니다. 기존 코드 수정 불필요.

---

## 9. 폼 관리

### React Hook Form + Zod

```typescript
// src/features/content/components/ContentForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod 스키마
const contentSchema = z.object({
  title: z.string().min(1, '제목을 입력하세요'),
  content: z.string().min(1, '내용을 입력하세요'),
  status: z.enum(['draft', 'published']),
  publishedAt: z.date().optional(),
});

type ContentFormData = z.infer<typeof contentSchema>;

export function ContentForm({
  initialData,
  onSubmit,
}: {
  initialData?: ContentFormData;
  onSubmit: (data: ContentFormData) => void;
}) {
  const form = useForm<ContentFormData>({
    resolver: zodResolver(contentSchema),
    defaultValues: initialData ?? {
      title: '',
      content: '',
      status: 'draft',
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label>제목</label>
        <input {...form.register('title')} />
        {form.formState.errors.title && (
          <span className="text-red-500">
            {form.formState.errors.title.message}
          </span>
        )}
      </div>

      <div>
        <label>내용</label>
        <textarea {...form.register('content')} />
      </div>

      <div>
        <label>상태</label>
        <select {...form.register('status')}>
          <option value="draft">초안</option>
          <option value="published">발행</option>
        </select>
      </div>

      <button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? '저장 중...' : '저장'}
      </button>
    </form>
  );
}
```

### 동적 폼 (콘텐츠 타입 기반)

```typescript
// src/features/content/components/DynamicForm.tsx
import { useForm, Controller } from 'react-hook-form';

interface DynamicFormProps {
  contentType: ContentType;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
}

export function DynamicForm({
  contentType,
  initialData,
  onSubmit
}: DynamicFormProps) {
  const form = useForm({
    defaultValues: initialData ?? {},
  });

  // 필드 타입별 입력 컴포넌트 렌더링
  const renderField = (field: FieldDefinition) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            {...form.register(field.name, { required: field.required })}
          />
        );

      case 'richtext':
        return (
          <Controller
            name={field.name}
            control={form.control}
            render={({ field: f }) => (
              <RichTextEditor value={f.value} onChange={f.onChange} />
            )}
          />
        );

      case 'image':
        return (
          <Controller
            name={field.name}
            control={form.control}
            render={({ field: f }) => (
              <ImagePicker value={f.value} onChange={f.onChange} />
            )}
          />
        );

      case 'relation':
        return (
          <Controller
            name={field.name}
            control={form.control}
            render={({ field: f }) => (
              <RelationPicker
                targetType={field.options.targetType}
                value={f.value}
                onChange={f.onChange}
              />
            )}
          />
        );

      // ... 기타 필드 타입
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {contentType.fields.map((field) => (
        <div key={field.name}>
          <label>{field.label}</label>
          {renderField(field)}
        </div>
      ))}

      <button type="submit">저장</button>
    </form>
  );
}
```

---

## 10. 다국어 (i18n)

### react-i18next 설정

```typescript
// src/lib/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "ko",
    supportedLngs: ["ko", "en"],

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  });

export default i18n;
```

### 번역 파일 구조

```
public/locales/
├── ko/
│   ├── common.json       # 공통 번역
│   ├── dashboard.json    # 대시보드
│   ├── content.json      # 콘텐츠 관리
│   └── settings.json     # 설정
└── en/
    ├── common.json
    ├── dashboard.json
    ├── content.json
    └── settings.json
```

### 사용 예시

```typescript
// 컴포넌트에서 사용
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const { t } = useTranslation('dashboard');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome', { name: user.name })}</p>
    </div>
  );
}

// JSON 파일
// public/locales/ko/dashboard.json
{
  "title": "대시보드",
  "welcome": "안녕하세요, {{name}}님"
}
```

---

## 11. 성능 최적화

### 코드 스플리팅

```typescript
// 페이지 단위 레이지 로딩
const Dashboard = lazy(() => import("@/pages/dashboard/DashboardPage"));
const PageBuilder = lazy(() => import("@/pages/page-builder/PageBuilderPage"));

// 무거운 컴포넌트 레이지 로딩
const RichTextEditor = lazy(() => import("@/components/editor/RichTextEditor"));
```

### React Compiler (자동 메모이제이션)

**CRITICAL:** React Compiler를 사용하므로 `useMemo`, `useCallback`, `React.memo` 등 수동 메모이제이션을 **절대 사용하지 않습니다**.

React Compiler가 컴파일 시간에 자동으로 컴포넌트와 훅에 메모이제이션을 적용하여 불필요한 리렌더링을 방지합니다.

**설치:**

```bash
pnpm add -D babel-plugin-react-compiler
```

**Vite 설정 (`vite.config.js`):**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['react-compiler'],
      },
    }),
  ],
});
```

**작성 방식:**

```javascript
// ❌ 잘못된 방식: 수동 메모이제이션 (사용 금지!)
import { memo, useCallback, useMemo } from 'react';

const ContentCard = memo(function ContentCard({ content, onClick }) {
  const handleClick = useCallback(() => onClick(content.id), [content.id, onClick]);
  const formattedDate = useMemo(() => formatDate(content.createdAt), [content.createdAt]);
  return <div onClick={handleClick}>{formattedDate}</div>;
});

// ✅ 올바른 방식: React Compiler가 자동 처리
function ContentCard({ content, onClick }) {
  const formattedDate = formatDate(content.createdAt);
  return <div onClick={() => onClick(content.id)}>{formattedDate}</div>;
}
```

**Context Provider도 동일:**

```javascript
// ❌ 잘못된 방식: useMemo로 value 메모이제이션 (불필요)
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
return <UserContext.Provider value={value}>{children}</UserContext.Provider>;

// ✅ 올바른 방식: React Compiler가 자동 처리
return (
  <UserContext.Provider value={{ user, login, logout }}>
    {children}
  </UserContext.Provider>
);
```

> **주의:** React Compiler는 React의 규칙(Rules of React)을 따라야 하는 코드를 기대합니다.
> 규칙을 위반하는 코드는 컴파일 시 경고됩니다.
>
> **규칙 예시:**
> - 훅은 최상위에서만 호출 (조건문/반복문 안에서 호출 금지)
> - Props/State는 불변성 유지 (직접 수정 금지)
> - Effect 의존성 배열은 정확하게 명시

### 가상화 (긴 목록)

```typescript
// @tanstack/react-virtual 사용
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList({ items }: { items: Content[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ContentCard content={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 이미지 최적화

```typescript
// 이미지 컴포넌트
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative" style={{ aspectRatio: width / height }}>
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          'transition-opacity',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
```

### 디바운싱/쓰로틀링

```typescript
// 검색 입력 디바운싱
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  const debouncedValue = useDebouncedValue(value, 300);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="검색..."
    />
  );
}

// useDebouncedValue 훅
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 환경 변수

```bash
# .env.example
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=CMS Admin
VITE_PUBLIC_URL=http://localhost:5173
```

> **Note:** 에디션 정보는 프론트엔드 환경변수가 아닌, 백엔드 API(`/config/edition`)를 통해 확인합니다.
> 프론트엔드는 이 정보를 GlobalContext에서 캐싱하여 메뉴/라우트 제어에 활용합니다.

---

## 참고 문서

- [React 공식 문서](https://react.dev)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com/)
- [dnd-kit](https://dndkit.com/)
- [TipTap Editor](https://tiptap.dev/)
- [프로젝트 기획서](./project.md)
- [백엔드 명세](./backend.md)
