/**
 * @description
 * 대시보드 페이지 (메인 페이지)
 * 통계 카드, 최근 콘텐츠 활동을 표시합니다.
 */
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
    FileText,
    Layers,
    Image,
    Users,
    ArrowRight,
    HardDrive,
    Search,
} from 'lucide-react';

import { useState } from 'react';
import { useAPI } from '@/Providers/APIContext.jsx';
import { useUser } from '@/Providers/UserContext.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { formatFileSize } from '@/lib/media-utils.js';
import '@/CSS/local/dashboard.css';

/** 상태 배지 매핑 */
const STATUS_MAP = {
    DRAFT: { label: '초안', variant: 'secondary' },
    REVIEW: { label: '검토 중', variant: 'outline' },
    APPROVED: { label: '승인됨', variant: 'default' },
    PUBLISHED: { label: '발행됨', variant: 'default' },
    REJECTED: { label: '반려됨', variant: 'destructive' },
    ARCHIVED: { label: '보관됨', variant: 'secondary' },
};

function Dashboard() {
    const api = useAPI();
    const { hasPermission } = useUser();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    // 콘텐츠 관련 권한이 하나라도 있어야 통계 표시
    const canViewStats = hasPermission('content:read');

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
        enabled: canViewStats,
    });

    if (isLoading) {
        return (
            <div className="dashboardPage">
                <h1 className="dashboardTitle">대시보드</h1>
                <div className="dashboardGrid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="dashboardCard dashboardCardSkeleton" />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const statCards = [
        {
            title: '콘텐츠',
            value: stats.contents.total,
            icon: FileText,
            desc: `발행 ${stats.contents.byStatus.PUBLISHED || 0}건`,
            onClick: () => navigate('/content-types'),
        },
        {
            title: '콘텐츠 타입',
            value: stats.contentTypes,
            icon: Layers,
            onClick: () => navigate('/content-types'),
        },
        {
            title: '파일',
            value: stats.media.count,
            icon: Image,
            desc: formatFileSize(stats.media.totalSize),
            onClick: () => navigate('/media'),
        },
        {
            title: '사용자',
            value: stats.users,
            icon: Users,
        },
    ];

    return (
        <div className="dashboardPage">
            <h1 className="dashboardTitle">대시보드</h1>
            {/* 통계 카드 */}
            <div className="dashboardGrid">
                {statCards.map((card) => (
                    <div
                        key={card.title}
                        className={`dashboardCard${card.onClick ? ' dashboardCardClickable' : ''}`}
                        onClick={card.onClick}
                    >
                        <div className="dashboardCardHeader">
                            <span className="dashboardCardLabel">{card.title}</span>
                            <card.icon className="dashboardCardIcon" />
                        </div>
                        <div className="dashboardCardValue">{card.value}</div>
                        {card.desc && (
                            <p className="dashboardCardDesc">{card.desc}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* 통합 검색 */}
            <div className="dashboardSearchBox">
                <Search className="dashboardSearchIcon" />
                <Input
                    placeholder="콘텐츠 통합 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                        }
                    }}
                    className="dashboardSearchInput"
                />
                <Button
                    onClick={() => {
                        if (searchQuery.trim()) {
                            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                        }
                    }}
                >
                    검색
                </Button>
            </div>


            {/* 콘텐츠 상태 요약 */}
            <div className="dashboardSection">
                <h2 className="dashboardSectionTitle">콘텐츠 상태</h2>
                <div className="dashboardStatusBar">
                    {Object.entries(STATUS_MAP).map(([key, config]) => {
                        const count = stats.contents.byStatus[key] || 0;
                        return (
                            <div key={key} className="dashboardStatusItem">
                                <Badge variant={config.variant}>{config.label}</Badge>
                                <span className="dashboardStatusCount">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 최근 콘텐츠 */}
            <div className="dashboardSection">
                <div className="dashboardSectionHeader">
                    <h2 className="dashboardSectionTitle">최근 활동</h2>
                </div>

                {stats.recentContents.length === 0 ? (
                    <div className="dashboardEmpty">
                        <FileText className="size-10 text-muted-foreground" />
                        <p>아직 콘텐츠가 없습니다</p>
                        <Button onClick={() => navigate('/content-types')}>
                            콘텐츠 타입 만들기
                        </Button>
                    </div>
                ) : (
                    <div className="dashboardTableWrap">
                        <table className="dashboardTable">
                            <thead>
                                <tr>
                                    <th>제목</th>
                                    <th>콘텐츠 타입</th>
                                    <th>상태</th>
                                    <th>수정자</th>
                                    <th>수정일</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentContents.map((item) => {
                                    const statusCfg = STATUS_MAP[item.status] || {
                                        label: item.status,
                                        variant: 'secondary',
                                    };
                                    return (
                                        <tr
                                            key={item.id}
                                            className="dashboardTableRow"
                                            onClick={() =>
                                                navigate(
                                                    `/contents/${item.contentType.slug}/${item.id}/edit`,
                                                )
                                            }
                                        >
                                            <td className="dashboardTableTitle">
                                                {item.title}
                                            </td>
                                            <td>
                                                <Badge variant="outline">
                                                    {item.contentType.name}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge variant={statusCfg.variant}>
                                                    {statusCfg.label}
                                                </Badge>
                                            </td>
                                            <td>{item.updatedBy.name}</td>
                                            <td>
                                                {format(
                                                    new Date(item.updatedAt),
                                                    'yyyy.MM.dd HH:mm',
                                                    { locale: ko },
                                                )}
                                            </td>
                                            <td>
                                                <ArrowRight className="size-4 text-muted-foreground" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 저장소 사용량 */}
            {stats.media.totalSize > 0 && (
                <div className="dashboardSection">
                    <h2 className="dashboardSectionTitle">저장소</h2>
                    <div className="dashboardStorageCard" onClick={() => navigate('/media')}>
                        <HardDrive className="size-5 text-muted-foreground" />
                        <div className="dashboardStorageInfo">
                            <span className="dashboardStorageValue">
                                {formatFileSize(stats.media.totalSize)}
                            </span>
                            <span className="dashboardStorageLabel">
                                {stats.media.count}개 파일
                            </span>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
