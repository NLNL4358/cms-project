/**
 * @description
 * 인증 가드 컴포넌트
 * 로그인하지 않은 사용자를 /login으로 리다이렉트합니다.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/Providers/UserContext.jsx';

export function AuthGuard({ children }) {
    const { user } = useUser();
    const location = useLocation();

    if (!user) {
        // 로그인하지 않은 경우 /login으로 리다이렉트
        // 현재 경로를 state로 전달 (로그인 후 원래 페이지로 복귀)
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
