/**
 * @description
 * 관리자 루트 사이드바 컴포넌트
 * 콘텐츠 폼/카테고리/콘텐츠/파일관리/Import-Export는 ContentHubSidebar(허브)로 분리됨.
 * 이 사이드바는 대시보드, 콘텐츠 관리(허브 진입), 사용자/권한, 외부 연동, 운영/데이터, 시스템 설정만 표시.
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Shield,
    Users,
    Settings,
    ScrollText,
    Webhook,
    HardDrive,
    Code,
    Key,
    LogOut,
    ChevronDown,
    Layers,
    Plug,
    Wrench,
    UserCog,
    FolderKanban,
} from 'lucide-react';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { getMediaUrl } from '@/lib/media-utils.js';

/**
 * 메뉴 그룹 정의 (루트 허브)
 * - 단일 메뉴: { type: 'item', title, path, icon, permission } or { permissionAny: [...] }
 * - 그룹 메뉴: { type: 'group', title, icon, children: [...] }
 *
 * permissionAny: 배열 중 하나라도 가지고 있으면 노출 (OR 조건).
 */
const menuStructure = [
    {
        type: 'item',
        title: '대시보드',
        path: '/',
        icon: LayoutDashboard,
    },
    {
        type: 'item',
        title: '콘텐츠 관리',
        path: '/content-forms', // 허브 첫 페이지 (Phase X: 콘텐츠 폼 목록)
        icon: FolderKanban,
        permissionAny: ['content-form:read', 'content:read', 'media:read', 'content:create'],
    },
    {
        type: 'group',
        id: 'users',
        title: '사용자 / 권한',
        icon: UserCog,
        children: [
            { title: '사용자 관리', path: '/users', icon: Users, permission: 'user:read' },
            { title: '역할/권한', path: '/roles', icon: Shield, permission: 'role:read' },
        ],
    },
    {
        type: 'group',
        id: 'integration',
        title: '외부 연동',
        icon: Plug,
        children: [
            { title: 'API 가이드', path: '/api-guide', icon: Code, permission: '*' },
            { title: 'API 키 관리', path: '/api-keys', icon: Key, permission: '*' },
            { title: 'Webhook', path: '/webhooks', icon: Webhook, permission: 'webhook:read' },
        ],
    },
    {
        type: 'group',
        id: 'operations',
        title: '운영 / 데이터',
        icon: Wrench,
        children: [
            { title: '감사 로그', path: '/audit-logs', icon: ScrollText, permission: 'audit-log:read' },
            { title: '백업/복원', path: '/backups', icon: HardDrive, permission: '*' },
        ],
    },
    {
        type: 'item',
        title: '시스템 설정',
        path: '/settings',
        icon: Settings,
        permission: 'settings:read',
    },
];

function AppSidebar() {
    const { user, logout, hasPermission } = useUser();
    const { settings, isMobile, setSidebarOpen, sidebarOpen } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();

    // 한 번에 하나의 그룹만 펼쳐짐
    const [openGroup, setOpenGroup] = useState(null);

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const isGroupActive = (group) => {
        if (group.type !== 'group') return false;
        return group.children.some((child) => child.path && isActive(child.path));
    };

    const toggleGroup = (id) => {
        setOpenGroup((prev) => (prev === id ? null : id));
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

    const userInitial =
        user?.username?.charAt(0)?.toUpperCase() ||
        user?.email?.charAt(0)?.toUpperCase() ||
        '?';

    /** 권한 조건 만족 여부 */
    const hasAccess = (entry) => {
        if (entry.permission && !hasPermission(entry.permission)) return false;
        if (entry.permissionAny && !entry.permissionAny.some((p) => hasPermission(p))) return false;
        return true;
    };

    const renderItem = (item, isChild = false) => (
        <li key={item.path}>
            <a
                href={item.path}
                className={`menuItem ${isChild ? 'menuItemChild' : ''} ${isActive(item.path) ? 'active' : ''}`}
                onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.path);
                }}
            >
                {item.icon && <item.icon className="menuIcon" />}
                <span>{item.title}</span>
            </a>
        </li>
    );

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
                <ul className="menuList">
                    {menuStructure.map((entry, idx) => {
                        if (entry.type === 'item') {
                            if (!hasAccess(entry)) return null;
                            return renderItem(entry);
                        }

                        // 그룹 전체에 permission이 있으면 확인
                        if (!hasAccess(entry)) return null;

                        // 하위 메뉴 중 권한 있는 것만 필터링
                        const visibleChildren = entry.children.filter((child) => hasAccess(child));

                        if (visibleChildren.length === 0) return null;

                        const groupActive = isGroupActive(entry);
                        const isOpen = openGroup === entry.id || groupActive;

                        return (
                            <li key={entry.id || idx} className="menuGroup">
                                <button
                                    type="button"
                                    className={`menuItem menuGroupHeader ${groupActive ? 'groupActive' : ''}`}
                                    onClick={() => toggleGroup(entry.id)}
                                >
                                    {entry.icon && <entry.icon className="menuIcon" />}
                                    <span>{entry.title}</span>
                                    <ChevronDown
                                        className={`menuGroupChevron ${isOpen ? 'open' : ''}`}
                                    />
                                </button>
                                <div className={`menuGroupCollapse ${isOpen ? 'open' : ''}`}>
                                    <ul className="menuChildList">
                                        {visibleChildren.map((child) => renderItem(child, true))}
                                    </ul>
                                </div>
                            </li>
                        );
                    })}
                </ul>
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
