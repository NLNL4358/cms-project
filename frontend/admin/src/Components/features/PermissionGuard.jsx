/**
 * @description
 * 권한 기반 접근 제어 컴포넌트
 * 필요한 권한이 없으면 대시보드로 리다이렉트합니다.
 * permission은 문자열(단일) 또는 배열(하나라도 만족 시 허용)을 받습니다.
 */
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUser } from '@/Providers/UserContext.jsx';

let lastRedirectToast = 0;

export function PermissionGuard({ permission, children }) {
    const { hasPermission } = useUser();

    // permission이 없으면 항상 허용 (대시보드 등)
    if (!permission) return <>{children}</>;

    // 배열이면 "any" 조건 — 하나라도 만족 시 통과
    const allowed = Array.isArray(permission)
        ? permission.some((p) => hasPermission(p))
        : hasPermission(permission);

    if (allowed) return <>{children}</>;

    // 3초 내 중복 토스트 방지
    const now = Date.now();
    if (now - lastRedirectToast > 3000) {
        lastRedirectToast = now;
        toast.error('접근 권한이 없습니다.', {
            description: '이 페이지에 접근할 권한이 없어 대시보드로 이동합니다.',
        });
    }

    return <Navigate to="/" replace />;
}
