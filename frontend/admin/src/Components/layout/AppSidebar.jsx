/**
 * @description
 * 관리자 사이드바 컴포넌트
 * 2뎁스 그룹 메뉴 + 동적 콘텐츠 폼
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
    Tags,
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
        // 대시보드는 항상 표시
    },
    {
        type: 'item',
        title: '콘텐츠 폼',
        path: '/content-forms',
        icon: AppWindow,
        permission: 'content-form:read',
    },
    {
        type: 'item',
        title: '카테고리',
        path: '/form-categories',
        icon: Tags,
        // 라우트/목록 조회는 content-form:read로 열려있음 — 메뉴도 동일 권한으로 노출.
        // 추가/수정/삭제 버튼은 FormCategoryList 내부에서 content-form:update로 분기.
        permission: 'content-form:read',
    },
    {
        type: 'item',
        title: '파일 관리',
        path: '/media',
        icon: Image,
        permission: 'media:read',
    },
    {
        type: 'group',
        id: 'content',
        title: '콘텐츠',
        icon: FolderKanban,
        permission: 'content:read',
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
            { title: 'Import/Export', path: '/import-export', icon: ArrowDownToLine, permission: 'content:create' },
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

/** 카테고리 없음 그룹을 식별하는 센티넬 키 */
const UNCATEGORIZED_KEY = '__uncategorized__';

function AppSidebar() {
    const { user, logout, hasPermission } = useUser();
    const { contentForms, formCategories, settings, isMobile, setSidebarOpen, sidebarOpen } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();

    // 한 번에 하나의 그룹만 펼쳐짐 (아코디언 방식)
    const [openGroup, setOpenGroup] = useState('content');

    // 카테고리 서브그룹의 접힘 상태 — 기본은 모두 펼침(닫힌 것만 Set에 저장)
    const [collapsedSubGroups, setCollapsedSubGroups] = useState(() => new Set());

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

    /** 서브그룹 토글 */
    const toggleSubGroup = (key) => {
        setCollapsedSubGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    /** 콘텐츠 폼을 카테고리별로 그룹핑 */
    const buildContentGroups = () => {
        if (contentForms.length === 0) return [];

        // 카테고리 메타 맵
        const categoryMap = new Map(
            (formCategories || []).map((c) => [c.id, c]),
        );

        // categoryId -> { category, items[] }
        const groups = new Map();
        contentForms.forEach((ct) => {
            const key = ct.categoryId || UNCATEGORIZED_KEY;
            if (!groups.has(key)) {
                const category =
                    key === UNCATEGORIZED_KEY ? null : categoryMap.get(ct.categoryId) || null;
                groups.set(key, { key, category, items: [] });
            }
            groups.get(key).items.push(ct);
        });

        // 정렬: 카테고리 order 오름차순, 그 다음 생성일, "카테고리 없음"은 맨 마지막
        return Array.from(groups.values()).sort((a, b) => {
            if (a.key === UNCATEGORIZED_KEY) return 1;
            if (b.key === UNCATEGORIZED_KEY) return -1;
            const aOrder = a.category?.order ?? 0;
            const bOrder = b.category?.order ?? 0;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.category?.name || '').localeCompare(b.category?.name || '');
        });
    };

    /** 개별 콘텐츠 폼 링크 렌더링 */
    const renderContentFormLink = (ct) => (
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
    );

    /** 동적 콘텐츠 목록 렌더링 — 카테고리별 그룹핑 */
    const renderDynamicContents = () => {
        const groups = buildContentGroups();
        if (groups.length === 0) return null;

        // 카테고리가 하나도 없고 "카테고리 없음"만 있으면 서브그룹 헤더 없이 평면 렌더
        const onlyUncategorized =
            groups.length === 1 && groups[0].key === UNCATEGORIZED_KEY;
        if (onlyUncategorized) {
            return groups[0].items.map(renderContentFormLink);
        }

        return groups.map(({ key, category, items }) => {
            const label =
                key === UNCATEGORIZED_KEY ? '카테고리 없음' : category?.name || '(이름 없음)';
            const isCollapsed = collapsedSubGroups.has(key);

            return (
                <li key={key} className="menuSubGroup">
                    <button
                        type="button"
                        className="menuSubGroupHeader"
                        onClick={() => toggleSubGroup(key)}
                    >
                        <span className="menuSubGroupLabel">{label}</span>
                        <span className="menuSubGroupCount">{items.length}</span>
                        <ChevronDown
                            className={`menuSubGroupChevron ${isCollapsed ? '' : 'open'}`}
                        />
                    </button>
                    <div className={`menuSubGroupCollapse ${isCollapsed ? '' : 'open'}`}>
                        <ul className="menuSubGroupList">
                            {items.map(renderContentFormLink)}
                        </ul>
                    </div>
                </li>
            );
        });
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
                        // 단일 메뉴 — 권한 확인
                        if (entry.type === 'item') {
                            if (entry.permission && !hasPermission(entry.permission)) return null;
                            return renderItem(entry);
                        }

                        // 그룹 전체에 permission이 있으면 확인
                        if (entry.permission && !hasPermission(entry.permission)) return null;

                        // 하위 메뉴 중 권한 있는 것만 필터링
                        const visibleChildren = entry.children.filter((child) => {
                            if (child.type === 'dynamic-contents') return true;
                            if (child.permission && !hasPermission(child.permission)) return false;
                            return true;
                        });

                        // 동적 콘텐츠만 있는 그룹은 콘텐츠 타입이 없으면 숨김
                        const hasOnlyDynamic = visibleChildren.every(
                            (c) => c.type === 'dynamic-contents',
                        );
                        if (hasOnlyDynamic && contentForms.length === 0) return null;

                        // 표시할 하위 메뉴가 없으면 그룹 자체 숨김
                        if (visibleChildren.length === 0) return null;

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
                                        {visibleChildren.map((child, ci) => {
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
