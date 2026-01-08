# 프론트엔드 기술 명세

이 문서는 CMS 프론트엔드의 기술적 구현 방향을 정의한다.

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

| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18.x | UI 라이브러리 |
| **TypeScript** | 5.x | 타입 안전성 |
| **Vite** | 5.x | 빌드 도구 (빠른 개발 서버) |

### 주요 라이브러리

| 라이브러리 | 용도 | 선정 이유 |
|------------|------|-----------|
| **React Router** | 라우팅 | React 표준, 안정적 |
| **TanStack Query** | 서버 상태 관리 | 캐싱, 자동 재요청, 에러 처리 |
| **Zustand** | 클라이언트 상태 관리 | 간단한 API, 작은 번들 크기 |
| **React Hook Form** | 폼 관리 | 성능 최적화, 유효성 검사 |
| **Zod** | 스키마 검증 | TypeScript 친화적, 런타임 검증 |
| **Axios** | HTTP 클라이언트 | 인터셉터, 에러 처리 |
| **date-fns** | 날짜 처리 | 가볍고 트리 쉐이킹 가능 |

### UI 라이브러리

| 라이브러리 | 용도 |
|------------|------|
| **Tailwind CSS** | 유틸리티 기반 스타일링 |
| **shadcn/ui** | UI 컴포넌트 (복사해서 사용) |
| **Lucide React** | 아이콘 |
| **Sonner** | 토스트 알림 |

### 페이지 빌더 관련

| 라이브러리 | 용도 |
|------------|------|
| **@dnd-kit** | 드래그 앤 드롭 |
| **TipTap** | 리치 텍스트 에디터 |
| **react-resizable-panels** | 패널 리사이즈 |

---

## 2. 프로젝트 구조

### 앱 분리

Admin Panel과 Public Site를 **모노레포** 구조로 관리한다.

```
frontend/
├── packages/
│   ├── admin/          # Admin Panel
│   ├── public/         # Public Site
│   └── shared/         # 공유 코드
├── package.json
└── pnpm-workspace.yaml
```

### 패키지별 구조 (Admin Panel 예시)

```
packages/admin/
├── src/
│   ├── app/                    # 앱 설정
│   │   ├── App.tsx
│   │   ├── router.tsx          # 라우터 설정
│   │   └── providers.tsx       # Provider 래퍼
│   │
│   ├── pages/                  # 페이지 컴포넌트
│   │   ├── dashboard/
│   │   ├── content/
│   │   ├── page-builder/
│   │   └── settings/
│   │
│   ├── features/               # 기능별 모듈
│   │   ├── auth/               # 인증
│   │   ├── content-type/       # 콘텐츠 타입
│   │   ├── content/            # 콘텐츠 CRUD
│   │   ├── media/              # 미디어 관리
│   │   └── page-builder/       # 페이지 빌더
│   │
│   ├── components/             # 공통 컴포넌트
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   └── common/             # 공통 UI
│   │
│   ├── hooks/                  # 커스텀 훅
│   ├── lib/                    # 유틸리티
│   ├── stores/                 # Zustand 스토어
│   ├── types/                  # TypeScript 타입
│   └── styles/                 # 전역 스타일
│
├── index.html
├── vite.config.ts
└── tailwind.config.js
```

### Feature 모듈 구조

각 feature는 관련 코드를 함께 관리한다.

```
features/content/
├── api/                # API 호출 함수
│   └── content.api.ts
├── hooks/              # 관련 훅
│   ├── useContents.ts
│   └── useContentMutation.ts
├── components/         # feature 전용 컴포넌트
│   ├── ContentList.tsx
│   ├── ContentForm.tsx
│   └── ContentCard.tsx
├── types/              # feature 전용 타입
│   └── content.types.ts
└── index.ts            # 외부 export
```

---

## 3. 상태 관리

### 상태 분류

| 상태 유형 | 관리 도구 | 예시 |
|-----------|-----------|------|
| **서버 상태** | TanStack Query | 콘텐츠 목록, 사용자 정보 |
| **클라이언트 상태** | Zustand | UI 상태, 모달, 사이드바 |
| **폼 상태** | React Hook Form | 입력값, 유효성 검사 |
| **URL 상태** | React Router | 필터, 페이지네이션 |

### TanStack Query 설정

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5분
      gcTime: 1000 * 60 * 30,        // 30분 (구 cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Query Key 규칙

```typescript
// 일관된 쿼리 키 구조
export const queryKeys = {
  // 콘텐츠
  contents: {
    all: ['contents'] as const,
    lists: () => [...queryKeys.contents.all, 'list'] as const,
    list: (params: ContentListParams) =>
      [...queryKeys.contents.lists(), params] as const,
    details: () => [...queryKeys.contents.all, 'detail'] as const,
    detail: (id: string) =>
      [...queryKeys.contents.details(), id] as const,
  },

  // 콘텐츠 타입
  contentTypes: {
    all: ['content-types'] as const,
    list: () => [...queryKeys.contentTypes.all, 'list'] as const,
    detail: (slug: string) =>
      [...queryKeys.contentTypes.all, slug] as const,
  },
};
```

### Zustand 스토어 예시

```typescript
// src/stores/ui.store.ts
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  modal: {
    type: string | null;
    data: unknown;
  };
  openModal: (type: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),

  modal: { type: null, data: null },
  openModal: (type, data) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: { type: null, data: null } }),
}));
```

---

## 4. API 통신

### Axios 인스턴스

```typescript
// src/lib/axios.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - Access Token 추가
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 에러 처리, 토큰 갱신
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 시 토큰 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await useAuthStore.getState().refresh();
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
```

### API 함수 패턴

```typescript
// src/features/content/api/content.api.ts
import { api } from '@/lib/axios';
import type { Content, ContentListParams, ContentCreateDto } from '../types';

export const contentApi = {
  // 목록 조회
  getList: async (params: ContentListParams) => {
    const { data } = await api.get<PaginatedResponse<Content>>(
      `/api/v1/contents/${params.contentType}`,
      { params }
    );
    return data;
  },

  // 단일 조회
  getById: async (contentType: string, id: string) => {
    const { data } = await api.get<Content>(
      `/api/v1/contents/${contentType}/${id}`
    );
    return data;
  },

  // 생성
  create: async (contentType: string, dto: ContentCreateDto) => {
    const { data } = await api.post<Content>(
      `/api/v1/contents/${contentType}`,
      dto
    );
    return data;
  },

  // 수정
  update: async (contentType: string, id: string, dto: ContentUpdateDto) => {
    const { data } = await api.patch<Content>(
      `/api/v1/contents/${contentType}/${id}`,
      dto
    );
    return data;
  },

  // 삭제
  delete: async (contentType: string, id: string) => {
    await api.delete(`/api/v1/contents/${contentType}/${id}`);
  },
};
```

### TanStack Query 훅

```typescript
// src/features/content/hooks/useContents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/content.api';
import { queryKeys } from '@/lib/query-keys';

// 목록 조회 훅
export function useContents(params: ContentListParams) {
  return useQuery({
    queryKey: queryKeys.contents.list(params),
    queryFn: () => contentApi.getList(params),
  });
}

// 단일 조회 훅
export function useContent(contentType: string, id: string) {
  return useQuery({
    queryKey: queryKeys.contents.detail(id),
    queryFn: () => contentApi.getById(contentType, id),
    enabled: !!id,
  });
}

// 생성 훅
export function useCreateContent(contentType: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ContentCreateDto) =>
      contentApi.create(contentType, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contents.lists()
      });
    },
  });
}

// 수정 훅
export function useUpdateContent(contentType: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ContentUpdateDto }) =>
      contentApi.update(contentType, id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.contents.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.contents.lists()
      });
    },
  });
}
```

---

## 5. 인증 처리

### 인증 스토어

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/axios';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/api/v1/auth/login', {
          email,
          password,
        });

        set({
          accessToken: data.accessToken,
          user: data.user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        api.post('/api/v1/auth/logout').catch(() => {});
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
      },

      refresh: async () => {
        const { data } = await api.post('/api/v1/auth/refresh');
        set({ accessToken: data.accessToken });
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // accessToken은 메모리에만 유지 (persist 제외)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 인증 가드 컴포넌트

```typescript
// src/components/auth/AuthGuard.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
}

export function AuthGuard({ children, requiredPermissions }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 미인증 시 로그인 페이지로
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 권한 확인
  if (requiredPermissions?.length) {
    const hasPermission = requiredPermissions.every(
      (p) => user?.permissions?.includes(p)
    );

    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
```

---

## 6. 라우팅

### 라우터 설정

```typescript
// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';

// 레이지 로딩
const Dashboard = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ContentList = lazy(() => import('@/pages/content/ContentListPage'));
const ContentEdit = lazy(() => import('@/pages/content/ContentEditPage'));

const router = createBrowserRouter([
  // 인증 불필요
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Admin Panel (인증 필요)
  {
    path: '/',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'content/:contentType',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContentList />
          </Suspense>
        ),
      },
      {
        path: 'content/:contentType/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContentEdit />
          </Suspense>
        ),
      },
      // ... 기타 라우트
    ],
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
```

### URL 상태 관리

```typescript
// 필터/페이지네이션을 URL 파라미터로 관리
import { useSearchParams } from 'react-router-dom';

export function useUrlParams<T extends Record<string, string>>() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = Object.fromEntries(searchParams.entries()) as T;

  const setParams = (newParams: Partial<T>) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === '') {
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

## 8. 페이지 빌더

### 아키텍처 개요

```
페이지 빌더
├── 캔버스 (Canvas)           # 드래그앤드롭 영역
├── 컴포넌트 팔레트 (Palette)  # 사용 가능한 컴포넌트 목록
├── 속성 패널 (Properties)     # 선택된 컴포넌트 설정
└── 레이어 패널 (Layers)       # 컴포넌트 계층 구조
```

### 페이지 데이터 구조

```typescript
// 페이지 JSON 구조
interface PageData {
  id: string;
  title: string;
  slug: string;
  components: ComponentNode[];
  settings: PageSettings;
}

interface ComponentNode {
  id: string;
  type: string;              // 'container', 'text', 'image' 등
  props: Record<string, unknown>;
  styles: CSSProperties;
  children?: ComponentNode[];
}

// 예시
const pageData: PageData = {
  id: '1',
  title: '회사 소개',
  slug: 'about',
  components: [
    {
      id: 'hero-1',
      type: 'hero',
      props: {
        title: '회사 소개',
        subtitle: '최고의 서비스를 제공합니다',
        backgroundImage: '/images/hero.jpg',
      },
      styles: { padding: '80px 0' },
      children: [],
    },
    {
      id: 'grid-1',
      type: 'grid',
      props: { columns: 2, gap: 24 },
      styles: {},
      children: [
        {
          id: 'text-1',
          type: 'text',
          props: { content: '<p>회사 설명...</p>' },
          styles: {},
        },
        {
          id: 'image-1',
          type: 'image',
          props: { src: '/images/company.jpg', alt: '회사 이미지' },
          styles: {},
        },
      ],
    },
  ],
  settings: {
    seo: { title: '회사 소개', description: '...' },
  },
};
```

### 컴포넌트 레지스트리

```typescript
// src/features/page-builder/components/registry.ts
import { TextComponent, TextEditor } from './Text';
import { ImageComponent, ImageEditor } from './Image';
import { ContainerComponent, ContainerEditor } from './Container';

export interface ComponentDefinition {
  type: string;
  label: string;
  icon: React.ComponentType;
  category: 'layout' | 'content' | 'interactive' | 'dynamic';

  // 렌더링 컴포넌트
  Component: React.ComponentType<ComponentProps>;

  // 속성 편집기
  Editor: React.ComponentType<EditorProps>;

  // 기본 props
  defaultProps: Record<string, unknown>;
}

export const componentRegistry: Record<string, ComponentDefinition> = {
  text: {
    type: 'text',
    label: '텍스트',
    icon: TextIcon,
    category: 'content',
    Component: TextComponent,
    Editor: TextEditor,
    defaultProps: { content: '<p>텍스트를 입력하세요</p>' },
  },
  image: {
    type: 'image',
    label: '이미지',
    icon: ImageIcon,
    category: 'content',
    Component: ImageComponent,
    Editor: ImageEditor,
    defaultProps: { src: '', alt: '' },
  },
  container: {
    type: 'container',
    label: '컨테이너',
    icon: BoxIcon,
    category: 'layout',
    Component: ContainerComponent,
    Editor: ContainerEditor,
    defaultProps: { padding: 16 },
  },
  // ... 추가 컴포넌트
};
```

### 드래그 앤 드롭 (dnd-kit)

```typescript
// src/features/page-builder/components/Canvas.tsx
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export function Canvas() {
  const { components, moveComponent, addComponent } = usePageBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // 팔레트에서 드래그 (새 컴포넌트 추가)
    if (active.data.current?.fromPalette) {
      addComponent(active.data.current.type, over.id as string);
      return;
    }

    // 캔버스 내 이동
    if (active.id !== over.id) {
      moveComponent(active.id as string, over.id as string);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={components} strategy={verticalListSortingStrategy}>
        <div className="canvas">
          {components.map((component) => (
            <SortableComponent key={component.id} node={component} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {/* 드래그 중인 컴포넌트 미리보기 */}
      </DragOverlay>
    </DndContext>
  );
}
```

### 페이지 빌더 상태

```typescript
// src/features/page-builder/stores/page-builder.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface PageBuilderState {
  // 페이지 데이터
  pageData: PageData | null;

  // 선택된 컴포넌트
  selectedId: string | null;

  // 히스토리 (실행취소/다시실행)
  history: PageData[];
  historyIndex: number;

  // 액션
  loadPage: (data: PageData) => void;
  selectComponent: (id: string | null) => void;
  addComponent: (type: string, parentId?: string) => void;
  updateComponent: (id: string, props: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
  moveComponent: (fromId: string, toId: string) => void;

  // 히스토리
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
}

export const usePageBuilderStore = create<PageBuilderState>()(
  immer((set, get) => ({
    pageData: null,
    selectedId: null,
    history: [],
    historyIndex: -1,

    loadPage: (data) => set({ pageData: data }),

    selectComponent: (id) => set({ selectedId: id }),

    addComponent: (type, parentId) => {
      const definition = componentRegistry[type];
      const newComponent: ComponentNode = {
        id: nanoid(),
        type,
        props: definition.defaultProps,
        styles: {},
        children: [],
      };

      set((state) => {
        if (!state.pageData) return;

        if (parentId) {
          const parent = findComponent(state.pageData.components, parentId);
          parent?.children?.push(newComponent);
        } else {
          state.pageData.components.push(newComponent);
        }
      });

      get().saveToHistory();
    },

    updateComponent: (id, updates) => {
      set((state) => {
        if (!state.pageData) return;
        const component = findComponent(state.pageData.components, id);
        if (component) {
          Object.assign(component, updates);
        }
      });
      get().saveToHistory();
    },

    // ... 기타 액션
  }))
);
```

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
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en'],

    interpolation: {
      escapeValue: false,
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
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
const Dashboard = lazy(() => import('@/pages/dashboard/DashboardPage'));
const PageBuilder = lazy(() => import('@/pages/page-builder/PageBuilderPage'));

// 무거운 컴포넌트 레이지 로딩
const RichTextEditor = lazy(() => import('@/components/editor/RichTextEditor'));
```

### React.memo 활용

```typescript
// 불필요한 리렌더링 방지
export const ContentCard = memo(function ContentCard({
  content,
  onClick
}: ContentCardProps) {
  return (
    <div onClick={() => onClick(content.id)}>
      <h3>{content.title}</h3>
      <p>{content.summary}</p>
    </div>
  );
});
```

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

---

## 참고 문서

- [React 공식 문서](https://react.dev)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [shadcn/ui](https://ui.shadcn.com/)
- [dnd-kit](https://dndkit.com/)
- [TipTap Editor](https://tiptap.dev/)
