/**
 * @description
 * 관리자 사이드바 컴포넌트
 * 일반 nav 기반으로, GlobalContext의 contentTypes를 활용하여 동적 메뉴를 생성합니다.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    AppWindow,
    FileText,
    Image,
    Shield,
    LogOut,
    ChevronDown,
} from 'lucide-react';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';

/** 고정 메뉴 정의 */
const mainMenuItems = [
    { title: '대시보드', path: '/', icon: LayoutDashboard },
    { title: '콘텐츠 타입', path: '/content-types', icon: AppWindow },
    { title: '미디어', path: '/media', icon: Image },
    { title: '역할/권한', path: '/roles', icon: Shield },
];

function AppSidebar() {
    const { user, logout } = useUser();
    const { contentTypes, isMobile, setSidebarOpen, sidebarOpen } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();
    const [contentOpen, setContentOpen] = useState(true);

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleNavigate = (path) => {
        navigate(path);
        if (isMobile) setSidebarOpen(false);
    };

    const handleLogout = () => {
        logout();
        if (isMobile) setSidebarOpen(false);
        navigate('/login', { replace: true });
    };

    return (
        <nav className={`sidebar ${isMobile && sidebarOpen ? 'true' : ''}`}>
            {/* 메뉴 */}
            <div className="sidebarMenu">
                {/* 고정 메뉴 */}
                <ul className="menuList">
                    {mainMenuItems.map((item) => (
                        <li key={item.path}>
                            <a
                                href={item.path}
                                className={`menuItem ${isActive(item.path) ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavigate(item.path);
                                }}
                            >
                                <item.icon className="menuIcon" />
                                <span>{item.title}</span>
                            </a>
                        </li>
                    ))}
                </ul>

                {/* 동적 콘텐츠 메뉴 */}
                {contentTypes.length > 0 && (
                    <>
                        <div className="menuDivider" />
                        <div className="menuGroup">
                            <button
                                className="menuGroupTitle"
                                onClick={() => setContentOpen(!contentOpen)}
                            >
                                <FileText className="menuIcon" />
                                <span>콘텐츠</span>
                                <ChevronDown
                                    className={`menuChevron ${contentOpen ? 'open' : ''}`}
                                />
                            </button>
                            {contentOpen && (
                                <ul className="menuSubList">
                                    {contentTypes.map((ct) => (
                                        <li key={ct.id}>
                                            <a
                                                href={`/contents/${ct.slug}`}
                                                className={`menuSubItem ${isActive(`/contents/${ct.slug}`) ? 'active' : ''}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleNavigate(
                                                        `/contents/${ct.slug}`,
                                                    );
                                                }}
                                            >
                                                <span>{ct.name}</span>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* 푸터 — 로그아웃 */}
            <div className="sidebarFooter">
                <button className="menuItem" onClick={handleLogout}>
                    <LogOut className="menuIcon" />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}

export default AppSidebar;
