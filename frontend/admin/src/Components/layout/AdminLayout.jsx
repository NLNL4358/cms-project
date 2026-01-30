/**
 * @description
 * 관리자 페이지의 메인 레이아웃 컴포넌트
 * Shadcn/ui의 SidebarProvider를 사용하여 Sidebar + Header + 메인 콘텐츠 영역을 구성합니다.
 * App.jsx에서 부모 Route의 element로 사용되며, <Outlet />으로 자식 라우트를 렌더링합니다.
 */
import { Outlet } from 'react-router-dom';

import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar.jsx';
import AppSidebar from '@/Components/layout/AppSidebar.jsx';
import AppHeader from '@/Components/layout/AppHeader.jsx';

function AdminLayout() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AppHeader />
                <main className="flex-1 p-4">
                    <Outlet />
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

export default AdminLayout;
