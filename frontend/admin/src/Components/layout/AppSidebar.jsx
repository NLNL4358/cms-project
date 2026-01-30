/**
 * @description
 * 관리자 사이드바 컴포넌트
 * Shadcn/ui Sidebar 기반으로, GlobalContext의 contentTypes를 활용하여 동적 메뉴를 생성합니다.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Blocks,
    FileText,
    Image,
    Shield,
    LogOut,
    ChevronDown,
} from 'lucide-react';

import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/Components/ui/sidebar.jsx';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/Components/ui/collapsible.jsx';

/** 고정 메뉴 정의 */
const mainMenuItems = [
    { title: '대시보드', path: '/', icon: LayoutDashboard },
    { title: '콘텐츠 타입', path: '/content-types', icon: Blocks },
    { title: '미디어', path: '/media', icon: Image },
    { title: '역할/권한', path: '/roles', icon: Shield },
];

function AppSidebar() {
    const { user, logout } = useUser();
    const { contentTypes } = useGlobal();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <Sidebar>
            {/* 헤더 */}
            <SidebarHeader className="border-b px-4 py-3">
                <span className="text-lg font-bold">CMS Admin</span>
            </SidebarHeader>

            {/* 메인 콘텐츠 */}
            <SidebarContent>
                {/* 기본 메뉴 */}
                <SidebarGroup>
                    <SidebarGroupLabel>메뉴</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainMenuItems.map((item) => (
                                <SidebarMenuItem key={item.path}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.path)}
                                        tooltip={item.title}
                                    >
                                        <a
                                            href={item.path}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(item.path);
                                            }}
                                        >
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* 동적 콘텐츠 메뉴 */}
                {contentTypes.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>콘텐츠</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible defaultOpen>
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip="콘텐츠">
                                                <FileText />
                                                <span>콘텐츠</span>
                                                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {contentTypes.map((ct) => (
                                                    <SidebarMenuSubItem
                                                        key={ct.id}
                                                    >
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={isActive(
                                                                `/contents/${ct.slug}`,
                                                            )}
                                                        >
                                                            <a
                                                                href={`/contents/${ct.slug}`}
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    navigate(
                                                                        `/contents/${ct.slug}`,
                                                                    );
                                                                }}
                                                            >
                                                                <span>
                                                                    {ct.name}
                                                                </span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            {/* 푸터 — 사용자 정보 + 로그아웃 */}
            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            <span>{user?.name || user?.email || '로그아웃'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
