/**
 * @description
 * 콘텐츠 관리 허브 전용 사이드바 컴포넌트
 * 루트 AdminLayout 사이드바와 구조는 동일하되, 콘텐츠 관련 메뉴만 노출하고
 * 상단에 "← 루트로" 돌아가는 버튼을 가집니다.
 *
 * 포함 메뉴: 콘텐츠 폼, 카테고리, 콘텐츠(동적), 파일 관리, Import/Export
 */
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AppWindow,
    FileText,
    Image,
    ArrowDownToLine,
    LogOut,
    ChevronDown,
    Layers,
    FolderKanban,
    Tags,
    ArrowLeft,
} from 'lucide-react';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { getMediaUrl } from '@/lib/media-utils.js';

/**
 * 허브 메뉴 구조
 * - 단일 메뉴: { type: 'item', title, path, icon, permission }
 * - 동적 콘텐츠: { type: 'dynamic-contents' }
 */
const menuStructure = [
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
        permission: 'content-form:read',
    },
    {
        type: 'group',
        id: 'content',
        title: '콘텐츠',
        icon: FolderKanban,
        permission: 'content:read',
        children: [{ type: 'dynamic-contents' }],
    },
    {
        type: 'item',
        title: '파일 관리',
        path: '/media',
        icon: Image,
        permission: 'media:read',
    },
    {
        type: 'item',
        title: 'Import/Export',
        path: '/import-export',
        icon: ArrowDownToLine,
        permission: 'content:create',
    },
];

/** 카테고리 없음 그룹을 식별하는 센티넬 키 */
const UNCATEGORIZED_KEY = '__uncategorized__';

function ContentHubSidebar() {
    const { user, logout, hasPermission } = useUser();
    const { contentForms, formCategories, settings, isMobile, setSidebarOpen, sidebarOpen } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();

    // 한 번에 하나의 그룹만 펼쳐짐
    const [openGroup, setOpenGroup] = useState('content');

    // 카테고리 서브그룹 접힘 상태
    const [collapsedSubGroups, setCollapsedSubGroups] = useState(() => new Set());

    const isActive = (path) => location.pathname.startsWith(path);

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

    const handleBackToRoot = () => {
        navigate('/');
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

    const toggleSubGroup = (key) => {
        setCollapsedSubGroups((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const buildContentGroups = () => {
        if (contentForms.length === 0) return [];
        const categoryMap = new Map((formCategories || []).map((c) => [c.id, c]));
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
        return Array.from(groups.values()).sort((a, b) => {
            if (a.key === UNCATEGORIZED_KEY) return 1;
            if (b.key === UNCATEGORIZED_KEY) return -1;
            const aOrder = a.category?.order ?? 0;
            const bOrder = b.category?.order ?? 0;
            if (aOrder !== bOrder) return aOrder - bOrder;
            return (a.category?.name || '').localeCompare(b.category?.name || '');
        });
    };

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

    const renderDynamicContents = () => {
        const groups = buildContentGroups();
        if (groups.length === 0) return null;
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
                    <p className="sidebarLogoSub">콘텐츠 관리</p>
                </div>
            </div>

            {/* 루트로 돌아가기 */}
            <button
                type="button"
                className="hubBackToRoot"
                onClick={handleBackToRoot}
            >
                <ArrowLeft className="hubBackToRootIcon" />
                <span>관리자 홈</span>
            </button>

            {/* 네비게이션 */}
            <nav className="sidebarNav">
                <ul className="menuList">
                    {menuStructure.map((entry, idx) => {
                        if (entry.type === 'item') {
                            if (entry.permission && !hasPermission(entry.permission)) return null;
                            return renderItem(entry);
                        }

                        if (entry.permission && !hasPermission(entry.permission)) return null;

                        const visibleChildren = entry.children.filter((child) => {
                            if (child.type === 'dynamic-contents') return true;
                            if (child.permission && !hasPermission(child.permission)) return false;
                            return true;
                        });

                        const hasOnlyDynamic = visibleChildren.every(
                            (c) => c.type === 'dynamic-contents',
                        );
                        if (hasOnlyDynamic && contentForms.length === 0) return null;
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

            {/* 푸터 */}
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

export default ContentHubSidebar;
