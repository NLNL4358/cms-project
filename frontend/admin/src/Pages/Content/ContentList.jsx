/**
 * @description
 * 콘텐츠 목록 페이지.
 * URL 파라미터의 contentTypeSlug로 해당 콘텐츠 타입의 콘텐츠를 표시합니다.
 * 동적 컬럼, 서버 페이지네이션, 검색, 상태 필터를 지원합니다.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useUser } from '@/Providers/UserContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { usePopup } from '@/Providers/PopupContext';

import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import { DataTable } from '@/Components/common/DataTable.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup';
import AlertPopup from '@/Components/common/AlertPopup';

/** 상태 배지 매핑 */
const STATUS_MAP = {
    DRAFT: { label: '초안', variant: 'secondary' },
    REVIEW: { label: '검토 중', variant: 'outline' },
    APPROVED: { label: '승인됨', variant: 'default' },
    PUBLISHED: { label: '발행됨', variant: 'default' },
    REJECTED: { label: '반려됨', variant: 'destructive' },
    ARCHIVED: { label: '보관됨', variant: 'secondary' },
};

function StatusBadge({ status }) {
    const config = STATUS_MAP[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
}

/** 필드 값 표시 헬퍼 */
function renderFieldValue(value, type) {
    if (value === null || value === undefined || value === '') return '-';
    if (type === 'boolean') return value ? '예' : '아니오';
    if (type === 'date' || type === 'datetime') {
        try {
            return format(new Date(value), 'yyyy.MM.dd', { locale: ko });
        } catch {
            return String(value);
        }
    }
    if (type === 'color') {
        return (
            <div className="flex items-center gap-1.5">
                <span
                    className="inline-block w-4 h-4 rounded border"
                    style={{ backgroundColor: value }}
                />
                <span>{value}</span>
            </div>
        );
    }
    // richtext: HTML 태그 제거 후 텍스트만 표시
    if (type === 'richtext' || type === 'textarea') {
        const text = String(value).replace(/<[^>]*>/g, '');
        return text.length > 50 ? text.slice(0, 50) + '...' : text;
    }
    // 이미지: 썸네일 표시
    if (type === 'image') {
        const url = String(value);
        if (!url) return '-';
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const src = url.startsWith('http') ? url : `${base}${url}`;
        return <img src={src} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />;
    }
    // 다중 이미지: 개수 표시
    if (type === 'images') {
        return Array.isArray(value) ? `${value.length}장` : '-';
    }
    // 파일: 파일명 표시
    if (type === 'file') {
        const url = String(value);
        return url ? url.split('/').pop() : '-';
    }
    // 다중 파일: 개수 표시
    if (type === 'files') {
        return Array.isArray(value) ? `${value.length}개` : '-';
    }
    if (typeof value === 'object') return JSON.stringify(value);
    const str = String(value);
    return str.length > 50 ? str.slice(0, 50) + '...' : str;
}

const LIMIT = 20;

function ContentList() {
    const api = useAPI();
    const { hasPermission } = useUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();
    const { contentTypeSlug } = useParams();
    const canUpdate = hasPermission('content:update');
    const canCreate = hasPermission('content:create');
    const canDelete = hasPermission('content:delete');
    const { contentTypes } = useGlobal();

    // slug로 콘텐츠 타입 조회
    const contentType = contentTypes.find((ct) => ct.slug === contentTypeSlug);

    // 필터 상태
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    // contentTypeSlug 변경 시 필터 초기화
    useEffect(() => {
        setPage(1);
        setStatusFilter('');
        setSearchInput('');
        setSearch('');
    }, [contentTypeSlug]);

    // 콘텐츠 목록 조회
    const { data: response, isLoading } = useQuery({
        queryKey: ['contents', contentType?.id, page, statusFilter, search],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set('contentTypeId', contentType.id);
            params.set('page', String(page));
            params.set('limit', String(LIMIT));
            if (statusFilter) params.set('status', statusFilter);
            if (search) params.set('search', search);
            return api.get(`/contents?${params}`).then((r) => r.data);
        },
        enabled: !!contentType?.id,
    });

    const contents = response?.data || [];
    const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };

    // 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/contents/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body={<p>콘텐츠가 삭제되었습니다.</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '삭제에 실패했습니다';
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 검색 실행
    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    // 동적 컬럼 생성
    const fields = contentType?.fields || [];
    const displayFields = fields.slice(0, 2);

    const columns = [
        {
            accessorKey: 'title',
            header: '제목',
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.original.isPinned && <span title="상단 고정">📌 </span>}
                    {row.original.isPrivate && <span title="비밀글">🔒 </span>}
                    {row.original.title}
                </span>
            ),
        },
        // slug 컬럼 (useSlug 옵션 활성화 시에만 표시)
        ...(contentType?.options?.useSlug !== false ? [{
            accessorKey: 'slug',
            header: '고유주소',
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.slug}</Badge>
            ),
        }] : []),
        // 동적 필드 컬럼 (최대 2개)
        ...displayFields.map((field) => ({
            id: `data_${field.name}`,
            header: field.label,
            cell: ({ row }) => {
                const value = row.original.data?.[field.name];
                return (
                    <span className="truncate max-w-[200px] block">
                        {renderFieldValue(value, field.type)}
                    </span>
                );
            },
        })),
        {
            accessorKey: 'status',
            header: '상태',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: 'viewCount',
            header: '조회',
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.viewCount || 0}</span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: '생성일',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {format(new Date(row.original.createdAt), 'yyyy.MM.dd', {
                        locale: ko,
                    })}
                </span>
            ),
        },
        ...(canUpdate ? [{
            id: 'edit',
            header: '수정',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                            `/contents/${contentTypeSlug}/${row.original.id}/edit`,
                        );
                    }}
                >
                    <Pencil className="size-4" />
                </Button>
            ),
        }] : []),
        ...(canDelete ? [{
            id: 'delete',
            header: '삭제',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        makePopup(
                            <YesNoPopup
                                title="콘텐츠 삭제"
                                body={
                                    <p>{`"${row.original.title}" 콘텐츠를 삭제하시겠습니까?`}</p>
                                }
                                buttonText={{
                                    left: '삭제',
                                    right: '취소',
                                }}
                                buttonFunction={{
                                    left: () =>
                                        deleteMutation.mutate(row.original.id),
                                    right: () => closePopup(),
                                }}
                            />,
                        );
                    }}
                >
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            ),
        }] : []),
    ];

    // 컬럼 너비
    const baseColWidths = [
        { width: 'auto' },
        { width: '13%' },
    ];
    const dynamicColWidths = displayFields.map(() => ({ width: '12%' }));
    const fixedColWidths = [
        { width: '8%' },
        { width: '10%' },
        { width: '5%', align: 'center' },
        { width: '5%', align: 'center' },
    ];
    const colWidths = [...baseColWidths, ...dynamicColWidths, ...fixedColWidths];

    // 콘텐츠 타입 로딩 대기
    if (!contentType) {
        return (
            <div className="pageInner">
                <div className="text-muted-foreground">
                    {contentTypes.length === 0
                        ? '불러오는 중...'
                        : '콘텐츠 폼을 찾을 수 없습니다.'}
                </div>
            </div>
        );
    }

    return (
        <div className="pageInner">
            {/* 페이지 헤더 */}
            <div className="pageHeadWrap flex items-end justify-between">
                <div className="pageTitle">
                    <h2 className="pageHead">{contentType.name}</h2>
                    <p className="pageDescription">
                        {contentType.description ||
                            `${contentType.name} 콘텐츠를 관리합니다`}
                    </p>
                </div>
                {canCreate && (
                    <Button
                        className="contentPlus"
                        onClick={() => navigate(`/contents/${contentTypeSlug}/new`)}
                    >
                        <Plus className="size-5" />
                        콘텐츠 추가
                    </Button>
                )}
            </div>

            {/* 검색 + 필터 */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative max-w-[300px] flex-1">
                    <Input
                        placeholder="제목 또는 고유주소 검색..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pr-9"
                    />
                    <button
                        type="button"
                        onClick={handleSearch}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <Search className="size-4" />
                    </button>
                </div>
                <Select
                    value={statusFilter || 'ALL'}
                    onValueChange={(v) => {
                        setStatusFilter(v === 'ALL' ? '' : v);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="전체 상태" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">전체</SelectItem>
                        <SelectItem value="DRAFT">초안</SelectItem>
                        <SelectItem value="REVIEW">검토 중</SelectItem>
                        <SelectItem value="APPROVED">승인됨</SelectItem>
                        <SelectItem value="PUBLISHED">발행됨</SelectItem>
                        <SelectItem value="REJECTED">반려됨</SelectItem>
                        <SelectItem value="ARCHIVED">보관됨</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 데이터 테이블 */}
            <div className="tableInner border rounded-lg">
                <DataTable
                    columns={columns}
                    colWidths={colWidths}
                    data={contents}
                    isLoading={isLoading}
                    emptyMessage="등록된 콘텐츠가 없습니다. 새 콘텐츠를 생성해보세요."
                    onRowClick={(row) =>
                        navigate(
                            `/contents/${contentTypeSlug}/${row.id}/${canUpdate ? 'edit' : 'view'}`,
                        )
                    }
                />
            </div>

            {/* 페이지네이션 */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <span className="text-sm text-muted-foreground">
                        총 {meta.total}건 중{' '}
                        {(meta.page - 1) * LIMIT + 1}-
                        {Math.min(meta.page * LIMIT, meta.total)}건
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            이전
                        </Button>
                        <span className="text-sm">
                            {page} / {meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            다음
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContentList;
