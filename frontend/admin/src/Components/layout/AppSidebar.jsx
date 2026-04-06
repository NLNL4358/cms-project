/**
 * @description
 * 관리자 사이드바 컴포넌트
 * 2뎁스 그룹 메뉴 + 동적 콘텐츠 타입
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
    ArrowDownToLine,
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
 * 메뉴 그룹 정의
 * - 단일 메뉴: { type: 'item', title, path, icon }
 * - 그룹 메뉴: { type: 'group', title, icon, children: [...] }
 * - 동적 콘텐츠: { type: 'dynamic-contents' } (콘텐츠 타입 그룹 안에 자동 삽입)
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
        title: '콘텐츠 타입',
        path: '/content-types',
        icon: AppWindow,
    },
    {
        type: 'item',
        title: '파일 관리',
        path: '/media',
        icon: Image,
    },
    {
        type: 'group',
        id: 'content',
        title: '콘텐츠',
        icon: FolderKanban,
        children: [
            { type: 'dynamic-contents' },
        ],
    },
    {
        type: 'group',
        id: 'users',
        title: '사용자 / 권한',
        icon: UserCog,
        children: [
            { title: '사용자 관리', path: '/users', icon: Users },
            { title: '역할/권한', path: '/roles', icon: Shield },
        ],
    },
    {
        type: 'group',
        id: 'integration',
        title: '외부 연동',
        icon: Plug,
        children: [
            { title: 'API 가이드', path: '/api-guide', icon: Code },
            { title: 'API 키 관리', path: '/api-keys', icon: Key },
            { title: 'Webhook', path: '/webhooks', icon: Webhook },
        ],
    },
    {
        type: 'group',
        id: 'operations',
        title: '운영 / 데이터',
        icon: Wrench,
        children: [
            { title: '감사 로그', path: '/audit-logs', icon: ScrollText },
            { title: 'Import/Export', path: '/import-export', icon: ArrowDownToLine },
            { title: '백업/복원', path: '/backups', icon: HardDrive },
        ],
    },
    {
        type: 'item',
        title: '시스템 설정',
        path: '/settings',
        icon: Settings,
    },
];

function AppSidebar() {
    const { user, logout } = useUser();
    const { contentTypes, settings, isMobile, setSidebarOpen, sidebarOpen } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();

    // 한 번에 하나의 그룹만 펼쳐짐 (아코디언 방식)
    const [openGroup, setOpenGroup] = useState('content');

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    /** 그룹 내에 활성 메뉴가 있는지 확인 (자동 펼침용) */
    const isGroupActive = (group) => {
        if (group.type !== 'group') return false;
        return group.children.some((child) => {
            if (child.type === 'dynamic-contents') {
                return location.pathname.startsWith('/contents/');
            }
            return child.path && isActive(child.path);
        });
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

    /** 사용자 이니셜 */
    const userInitial =
        user?.username?.charAt(0)?.toUpperCase() ||
        user?.email?.charAt(0)?.toUpperCase() ||
        '?';

    /** 단일 메뉴 항목 렌더링 */
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

    /** 동적 콘텐츠 타입 목록 렌더링 (그룹 안에서) */
    const renderDynamicContents = () => {
        if (contentTypes.length === 0) return null;
        return contentTypes.map((ct) => (
            <li key={ct.id}>
                <a
                    href={`/contents/${ct.slug}`}
                    className={`menuItem menuItemChild ${isActive(`/contents/${ct.slug}`) ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(`/contents/${ct.slug}`);
                    }}
                >
                    <FileText className="menuIcon" />
                    <span>{ct.name}</span>
                </a>
            </li>
        ));
    };

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
                        // 단일 메뉴
                        if (entry.type === 'item') {
                            return renderItem(entry);
                        }

                        // 동적 콘텐츠만 있는 그룹은 콘텐츠 타입이 없으면 숨김
                        const hasOnlyDynamic = entry.children.every(
                            (c) => c.type === 'dynamic-contents',
                        );
                        if (hasOnlyDynamic && contentTypes.length === 0) {
                            return null;
                        }

                        // 그룹 메뉴
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
                                        {entry.children.map((child, ci) => {
                                            if (child.type === 'dynamic-contents') {
                                                return (
                                                    <span key={`dyn-${ci}`}>
                                                        {renderDynamicContents()}
                                                    </span>
                                                );
                                            }
                                            return renderItem(child, true);
                                        })}
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
