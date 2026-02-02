import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import { DataTable } from '@/Components/common/DataTable.jsx';
import { DeleteDialog } from '@/Components/common/DeleteDialog.jsx';

/**
 * 콘텐츠 타입 목록 페이지
 *
 * 등록된 콘텐츠 타입을 테이블로 표시한다.
 * 생성/편집/삭제 기능을 제공한다.
 */
function ContentTypeList() {
    const api = useAPI();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 삭제 다이얼로그 상태
    const [deleteTarget, setDeleteTarget] = useState(null);

    // 콘텐츠 타입 목록 조회
    const { data: contentTypes = [], isLoading } = useQuery({
        queryKey: ['content-types'],
        queryFn: () => api.get('/content-types').then((r) => r.data),
    });

    // 콘텐츠 타입 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/content-types/${id}`),
        onSuccess: () => {
            // 캐시 무효화 — 목록 + GlobalContext contentTypes 모두 갱신
            queryClient.invalidateQueries({ queryKey: ['content-types'] });
            setDeleteTarget(null);
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '삭제에 실패했습니다';
            alert(message);
            setDeleteTarget(null);
        },
    });

    // 삭제 확인 핸들러
    const handleDeleteConfirm = () => {
        if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
        }
    };

    // 테이블 컬럼 정의
    const columns = [
        {
            accessorKey: 'name',
            header: '이름',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.name}</span>
            ),
        },
        {
            accessorKey: 'slug',
            header: '슬러그',
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.slug}</Badge>
            ),
        },
        {
            id: 'fieldCount',
            header: '필드 수',
            cell: ({ row }) => {
                const fields = row.original.fields;
                const count = Array.isArray(fields) ? fields.length : 0;
                return <span>{count}개</span>;
            },
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
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                    {/* 편집 버튼 */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/content-types/${row.original.id}/edit`);
                        }}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    {/* 삭제 버튼 */}
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(row.original);
                        }}
                    >
                        <Trash2 className="size-4 text-destructive" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-6">
            {/* 페이지 헤더 */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">콘텐츠 타입</h1>
                    <p className="text-muted-foreground mt-1">
                        콘텐츠의 구조를 정의하는 타입을 관리합니다
                    </p>
                </div>
                <Button onClick={() => navigate('/content-types/new')}>
                    <Plus className="size-4" />
                    새 콘텐츠 타입
                </Button>
            </div>

            {/* 데이터 테이블 */}
            <div className="border rounded-lg">
                <DataTable
                    columns={columns}
                    data={contentTypes}
                    isLoading={isLoading}
                    emptyMessage="등록된 콘텐츠 타입이 없습니다. 새 콘텐츠 타입을 생성해보세요."
                    onRowClick={(row) => navigate(`/content-types/${row.id}/edit`)}
                />
            </div>

            {/* 삭제 확인 다이얼로그 */}
            <DeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => {
                    if (!open) setDeleteTarget(null);
                }}
                title="콘텐츠 타입 삭제"
                description={
                    deleteTarget
                        ? `"${deleteTarget.name}" 콘텐츠 타입을 삭제하시겠습니까? 이 타입에 연결된 콘텐츠가 있으면 삭제할 수 없습니다.`
                        : ''
                }
                onConfirm={handleDeleteConfirm}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

export default ContentTypeList;
