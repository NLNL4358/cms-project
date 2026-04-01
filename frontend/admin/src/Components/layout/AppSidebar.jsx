/**
 * @description
 * 관리자 사이드바 컴포넌트
 * 다크 슬레이트 배경, 인디고 활성 표시기, 섹션 분리 디자인
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    AppWindow,
    FileText,
    Image,
    Shield,
    Users,
    Settings,
    ScrollText,
    Webhook,
    LogOut,
    ChevronDown,
    Layers,
} from 'lucide-react';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { getMediaUrl } from '@/lib/media-utils.js';

/** 고정 메뉴 정의 */
const mainMenuItems = [
    { title: '대시보드', path: '/', icon: LayoutDashboard },
    { title: '콘텐츠 타입', path: '/content-types', icon: AppWindow },
    { title: '파일 관리', path: '/media', icon: Image },
    { title: '역할/권한', path: '/roles', icon: Shield },
    { title: '사용자 관리', path: '/users', icon: Users },
    { title: '감사 로그', path: '/audit-logs', icon: ScrollText },
    { title: 'Webhook', path: '/webhooks', icon: Webhook },
    { title: '시스템 설정', path: '/settings', icon: Settings },
];

function AppSidebar() {
    const { user, logout } = useUser();
    const { contentTypes, settings, isMobile, setSidebarOpen, sidebarOpen } = useGlobal();
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

    /** 사용자 이니셜 */
    const userInitial =
        user?.username?.charAt(0)?.toUpperCase() ||
        user?.email?.charAt(0)?.toUpperCase() ||
        '?';

    return (
        <aside className={`sidebar ${isMobile && sidebarOpen ? 'open' : ''}`}>
            {/* 로고 */}
            <div className="sidebarLogoWrap">
                {settings?.logoUrl ? (
                    <img
                        src={getMediaUrl(settings.logoUrl)}
                        alt="로고"
                        className="sidebarLogoImage"
                    />
                ) : (
                    <div className="sidebarLogoIcon">
                        <Layers size={14} />
                    </div>
                )}
                <div>
                    <p className="sidebarLogoTitle">
                        {settings?.siteName || 'ContentCMS'}
                    </p>
                    <p className="sidebarLogoSub">Admin Panel</p>
                </div>
            </div>

            {/* 네비게이션 */}
            <nav className="sidebarNav">
                {/* 메뉴 섹션 */}
                <div className="sidebarSection">
                    <p className="sidebarSectionTitle">메뉴</p>
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
                </div>

                {/* 동적 콘텐츠 섹션 */}
                {contentTypes.length > 0 && (
                    <div className="sidebarSection">
                        <button
                            className="sidebarSectionTitle clickable"
                            onClick={() => setContentOpen(!contentOpen)}
                        >
                            <span>콘텐츠</span>
                            <span className="sidebarSectionBadge">
                                {contentTypes.length}
                            </span>
                            <ChevronDown
                                className={`sidebarSectionChevron ${contentOpen ? 'open' : ''}`}
                            />
                        </button>
                        {contentOpen && (
                            <ul className="menuList">
                                {contentTypes.map((ct) => (
                                    <li key={ct.id}>
                                        <a
                                            href={`/contents/${ct.slug}`}
                                            className={`menuItem ${isActive(`/contents/${ct.slug}`) ? 'active' : ''}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavigate(
                                                    `/contents/${ct.slug}`,
                                                );
                                            }}
                                        >
                                            <FileText className="menuIcon" />
                                            <span>{ct.name}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </nav>

            {/* 푸터 — 사용자 정보 + 로그아웃 */}
            <div className="sidebarFooter">
                <div className="sidebarUserInfo">
                    <div className="sidebarAvatar">{userInitial}</div>
                    <div className="sidebarUserText">
                        <p className="sidebarUserName">
                            {user?.username || '사용자'}
                        </p>
                        <p className="sidebarUserEmail">{user?.email || ''}</p>
                    </div>
                    <button
                        className="sidebarLogoutBtn"
                        onClick={handleLogout}
                        title="로그아웃"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default AppSidebar;
