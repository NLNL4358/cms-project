/**
 * @description
 * 콘텐츠 폼 카테고리 목록 페이지
 * 등록된 카테고리를 테이블로 표시하고 생성/편집/삭제 기능을 제공합니다.
 * 카테고리는 콘텐츠 폼(ContentType)을 그룹핑하는 상위 엔티티입니다.
 */
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useUser } from '@/Providers/UserContext.jsx';
import { usePopup } from '@/Providers/PopupContext';

import { Button } from '@/Components/ui/Button.jsx';
import { DataTable } from '@/Components/common/DataTable.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup';
import AlertPopup from '@/Components/common/AlertPopup';

function FormCategoryList() {
    const api = useAPI();
    const { hasPermission } = useUser();
    const { makePopup, closePopup } = usePopup();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 카테고리 권한은 콘텐츠 폼(ContentType)의 각 CRUD 권한과 1:1 매핑
    const canCreate = hasPermission('content-type:create');
    const canUpdate = hasPermission('content-type:update');
    const canDelete = hasPermission('content-type:delete');

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['form-categories'],
        queryFn: () => api.get('/form-categories').then((r) => r.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/form-categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-categories'] });
            queryClient.invalidateQueries({ queryKey: ['content-types'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body={<p>카테고리가 삭제되었습니다.</p>}
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

    const handleDelete = (row) => {
        const formCount = row._count?.contentTypes || 0;
        makePopup(
            <YesNoPopup
                title="카테고리 삭제"
                body={
                    <>
                        <p>{`"${row.name}" 카테고리를 삭제하시겠습니까?`}</p>
                        {formCount > 0 ? (
                            <p>
                                {`이 카테고리에 속한 콘텐츠 폼 ${formCount}개는 "카테고리 없음"으로 이동됩니다. (콘텐츠 폼 자체는 삭제되지 않습니다)`}
                            </p>
                        ) : (
                            <p>이 카테고리에 속한 콘텐츠 폼이 없습니다.</p>
                        )}
                    </>
                }
                buttonText={{ left: '삭제', right: '취소' }}
                buttonFunction={{
                    left: () => deleteMutation.mutate(row.id),
                    right: () => closePopup(),
                }}
            />,
        );
    };

    const columns = [
        {
            accessorKey: 'name',
            header: '카테고리 이름',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <span className="font-medium">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: '설명',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.description || '-'}
                </span>
            ),
        },
        {
            id: 'formCount',
            header: '소속 콘텐츠 폼',
            cell: ({ row }) => {
                const count = row.original._count?.contentTypes || 0;
                return <span>{count}개</span>;
            },
        },
        {
            accessorKey: 'order',
            header: '순서',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.order}
                </span>
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
    ];

    if (canUpdate) {
        columns.push({
            id: 'edit',
            header: '수정',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/form-categories/${row.original.id}/edit`);
                    }}
                >
                    <Pencil className="size-4" />
                </Button>
            ),
        });
    }

    if (canDelete) {
        columns.push({
            id: 'delete',
            header: '삭제',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row.original);
                    }}
                >
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            ),
        });
    }

    // 고정 컬럼 5개 + 선택적 수정/삭제 컬럼 최대 2개
    const baseWidths = [
        { width: 'auto' },                 // 이름
        { width: '32%' },                  // 설명
        { width: '12%', align: 'center' }, // 소속 콘텐츠 폼
        { width: '8%', align: 'center' },  // 순서
        { width: '12%' },                  // 생성일
    ];
    const actionWidths = [];
    if (canUpdate) actionWidths.push({ width: '5%', align: 'center' });
    if (canDelete) actionWidths.push({ width: '5%', align: 'center' });
    const colWidths = [...baseWidths, ...actionWidths];

    return (
        <div className="pageInner">
            <div className="pageHeadWrap flex items-end justify-between">
                <div className="pageTitle">
                    <h2 className="pageHead">카테고리</h2>
                    <p className="pageDescription">
                        콘텐츠 폼을 분류하는 카테고리를 관리합니다. 사이드바의 콘텐츠 메뉴가 카테고리별로 그룹핑됩니다.
                    </p>
                </div>
                {canCreate && (
                    <Button
                        className="contentPlus"
                        onClick={() => navigate('/form-categories/new')}
                    >
                        <Plus className="size-5" />
                        카테고리 추가
                    </Button>
                )}
            </div>

            <div className="tableInner border rounded-lg">
                <DataTable
                    columns={columns}
                    colWidths={colWidths}
                    data={categories}
                    isLoading={isLoading}
                    emptyMessage="등록된 카테고리가 없습니다. 새 카테고리를 생성해보세요."
                    onRowClick={
                        canUpdate
                            ? (row) =>
                                  navigate(`/form-categories/${row.id}/edit`)
                            : undefined
                    }
                />
            </div>
        </div>
    );
}

export default FormCategoryList;
