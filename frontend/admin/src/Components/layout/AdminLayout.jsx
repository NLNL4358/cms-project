/**
 * @description
 * 관리자 페이지의 메인 레이아웃 컴포넌트
 * PC: 헤더 + (좌측 사이드바 | 메인 콘텐츠)
 * 모바일: 헤더 + 메인 콘텐츠, 사이드바는 오른쪽 오버레이 드로어
 */
import { Outlet } from 'react-router-dom';

import { useGlobal } from '@/Providers/GlobalContext.jsx';
import AppSidebar from '@/Components/layout/AppSidebar.jsx';
import AppHeader from '@/Components/layout/AppHeader.jsx';

function AdminLayout() {
    const { isMobile, sidebarOpen, setSidebarOpen } = useGlobal();

    return (
        <div className="adminLayout">
            <AppHeader />
            <div className={`adminMain ${isMobile ? 'mobile' : ''} `}>
                <AppSidebar />
                <main className="adminContent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
