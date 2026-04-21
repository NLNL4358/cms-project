/**
 * @description
 * 콘텐츠 관리 허브 전용 레이아웃
 * 루트 AdminLayout과 구조는 동일하지만 ContentHubSidebar를 사용합니다.
 */
import { Outlet } from 'react-router-dom';

import { useGlobal } from '@/Providers/GlobalContext.jsx';
import ContentHubSidebar from '@/Components/layout/ContentHubSidebar.jsx';
import AppHeader from '@/Components/layout/AppHeader.jsx';

function ContentHubLayout() {
    const { isMobile, sidebarOpen, setSidebarOpen } = useGlobal();

    return (
        <div className={`adminLayout ${isMobile ? 'mobile' : ''}`}>
            <ContentHubSidebar />

            {/* 모바일 오버레이 */}
            {isMobile && (
                <div
                    className={`drawerOverlay ${sidebarOpen ? 'open' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="adminMain">
                <AppHeader />
                <main className="adminContent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default ContentHubLayout;
