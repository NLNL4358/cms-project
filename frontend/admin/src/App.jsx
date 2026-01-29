import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/Components/features/AuthGuard.jsx';
import Login from '@pages/System/Login.jsx';

/* CSS */
import '@/CSS/reset.css';
import '@/CSS/index.css';

function App() {
    return (
        <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={<Login />} />

            {/* 보호된 라우트 - 로그인 필요 */}
            <Route
                path="/"
                element={
                    <AuthGuard>
                        <div className="inner">대시보드 (로그인 성공!)</div>
                    </AuthGuard>
                }
            />

            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
