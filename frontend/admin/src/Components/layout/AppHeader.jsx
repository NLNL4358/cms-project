/**
 * @description
 * 관리자 헤더 컴포넌트
 * 브레드크럼과 사용자 드롭다운을 포함합니다.
 */
import { useLocation, useNavigate } from 'react-router-dom';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu.jsx';
import { LogOut, User, ChevronRight, Menu } from 'lucide-react';

/** 경로 → 브레드크럼 라벨 매핑 */
const pathLabels = {
    'content-types': '콘텐츠 타입',
    contents: '콘텐츠',
    media: '미디어',
    roles: '역할/권한',
};

function AppHeader() {
    const { user, logout } = useUser();
    const { contentTypes, isMobile, setSidebarOpen } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    /** 현재 경로에서 브레드크럼 생성 */
    const buildBreadcrumbs = () => {
        const segments = location.pathname.split('/').filter(Boolean);
        if (segments.length === 0) return [{ label: '대시보드' }];

        const crumbs = [];
        let currentPath = '';

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            currentPath += `/${segment}`;

            let label = pathLabels[segment] || segment;

            // contents/:slug 의 slug 부분을 contentType 이름으로 변환
            if (segments[i - 1] === 'contents' && contentTypes.length > 0) {
                const ct = contentTypes.find((c) => c.slug === segment);
                if (ct) label = ct.name;
            }

            crumbs.push({
                label,
                path: i < segments.length - 1 ? currentPath : null,
            });
        }

        return crumbs;
    };

    const breadcrumbs = buildBreadcrumbs();

    return (
        <header className="adminHeader">
            {/* 브레드크럼 */}
            <div className="breadcrumb">
                {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="breadcrumbSegment">
                        {i > 0 && <ChevronRight className="breadcrumbSep" />}
                        {crumb.path ? (
                            <a
                                href={crumb.path}
                                className="breadcrumbLink"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(crumb.path);
                                }}
                            >
                                {crumb.label}
                            </a>
                        ) : (
                            <span className="breadcrumbCurrent">
                                {crumb.label}
                            </span>
                        )}
                    </span>
                ))}
            </div>

            {/* 모바일: 햄버거 메뉴 버튼 */}
            {isMobile && (
                <button
                    className="hamburgerBtn"
                    onClick={() => setSidebarOpen((v) => !v)}
                >
                    <Menu className="hamburgerIcon" />
                </button>
            )}
        </header>
    );
}

export default AppHeader;
