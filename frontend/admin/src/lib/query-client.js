/**
 * @description
 * TanStack Query 클라이언트 설정
 *
 * QueryClient는 서버 데이터를 캐싱하고 자동으로 갱신/관리하는 역할을 합니다.
 * 모든 useQuery, useMutation 훅이 이 클라이언트를 통해 작동합니다.
 *
 * main.jsx에서 <QueryClientProvider client={queryClient}>로 전체 앱에 제공됩니다.
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * staleTime: 데이터가 "신선한" 상태로 유지되는 시간
       * - 5분 동안은 같은 데이터를 다시 요청해도 서버에 요청하지 않고 캐시에서 반환
       * - 5분이 지나면 "stale(오래된)" 상태가 되어 백그라운드에서 자동 재요청
       */
      staleTime: 1000 * 60 * 5, // 5분

      /**
       * gcTime (Garbage Collection Time): 캐시가 메모리에 남아있는 시간
       * - 사용하지 않는 캐시를 30분 후에 메모리에서 제거
       * - 이전 이름: cacheTime
       */
      gcTime: 1000 * 60 * 30, // 30분

      /**
       * retry: 요청 실패 시 재시도 횟수
       * - 네트워크 오류 등으로 실패하면 1번 더 재시도
       * - 0으로 설정하면 재시도 안 함
       */
      retry: 1,

      /**
       * refetchOnWindowFocus: 브라우저 창에 포커스할 때 자동 재요청 여부
       * - false: 다른 탭 갔다가 돌아와도 자동 재요청 안 함
       * - true: 포커스할 때마다 최신 데이터로 갱신 (기본값)
       */
      refetchOnWindowFocus: false,
    },
  },
});
