/**
 * @description
 * 인증 가드 컴포넌트
 * 로그인하지 않은 사용자를 /login으로 리다이렉트합니다.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/Providers/UserContext.jsx';

export function AuthGuard({ children }) {
    const { user, isReady } = useUser();
    const location = useLocation();

    // 토큰 갱신 완료 대기 (새로고침 시 refresh 전 렌더링 방지)
    if (!isReady) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
