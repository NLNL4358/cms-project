/**
 * @description
 * 관리자 헤더 컴포넌트
 * 사이드바 토글 버튼, 브레드크럼, 사용자 드롭다운을 포함합니다.
 */
import { useLocation, useNavigate } from 'react-router-dom';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { SidebarTrigger } from '@/Components/ui/sidebar.jsx';
import { Separator } from '@/Components/ui/separator.jsx';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/Components/ui/breadcrumb.jsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu.jsx';
import { LogOut, User } from 'lucide-react';

/** 경로 → 브레드크럼 라벨 매핑 */
const pathLabels = {
    'content-types': '콘텐츠 타입',
    contents: '콘텐츠',
    media: '미디어',
    roles: '역할/권한',
};

function AppHeader() {
    const { user, logout } = useUser();
    const { contentTypes } = useGlobal();
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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />

            {/* 브레드크럼 */}
            <Breadcrumb className="flex-1">
                <BreadcrumbList>
                    {breadcrumbs.map((crumb, i) => (
                        <span key={i} className="contents">
                            {i > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem>
                                {crumb.path ? (
                                    <BreadcrumbLink
                                        href={crumb.path}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate(crumb.path);
                                        }}
                                    >
                                        {crumb.label}
                                    </BreadcrumbLink>
                                ) : (
                                    <BreadcrumbPage>
                                        {crumb.label}
                                    </BreadcrumbPage>
                                )}
                            </BreadcrumbItem>
                        </span>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>

            {/* 사용자 드롭다운 */}
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-accent">
                    <User className="h-4 w-4" />
                    <span>{user?.name || user?.email}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        로그아웃
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}

export default AppHeader;
