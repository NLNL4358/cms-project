/**
 * @description
 * 역할/권한 관리 목록 페이지
 * 등록된 역할을 테이블로 표시하고 생성/편집/삭제 기능을 제공합니다.
 */
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';

import { Button } from '@/Components/ui/Button.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import { DataTable } from '@/Components/common/DataTable.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup';
import AlertPopup from '@/Components/common/AlertPopup';

function RoleList() {
    const api = useAPI();
    const { makePopup, closePopup } = usePopup();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/roles').then((r) => r.data),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/roles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body={<p>역할이 삭제되었습니다.</p>}
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

    const columns = [
        {
            accessorKey: 'name',
            header: '역할 이름',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    <span className="font-medium">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'slug',
            header: '고유주소',
            cell: ({ row }) => (
                <Badge variant="secondary">{row.original.slug}</Badge>
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
            id: 'permissionCount',
            header: '권한 수',
            cell: ({ row }) => {
                const perms = row.original.permissions;
                const count = Array.isArray(perms) ? perms.length : 0;
                if (count === 1 && perms[0] === '*') {
                    return <Badge variant="default">전체 권한</Badge>;
                }
                return <span>{count}개</span>;
            },
        },
        {
            id: 'userCount',
            header: '사용자 수',
            cell: ({ row }) => {
                const count = row.original._count?.users || 0;
                return <span>{count}명</span>;
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
            id: 'edit',
            header: '수정',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/roles/${row.original.id}/edit`);
                    }}
                >
                    <Pencil className="size-4" />
                </Button>
            ),
        },
        {
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
                                title="역할 삭제"
                                body={
                                    <>
                                        <p>
                                            {`"${row.original.name}" 역할을 삭제하시겠습니까?`}
                                        </p>
                                        <p>
                                            이 역할을 사용 중인 사용자가 있으면
                                            삭제할 수 없습니다.
                                        </p>
                                    </>
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
        },
    ];

    const colWidths = [
        { width: 'auto' },
        { width: '12%' },
        { width: '25%' },
        { width: '8%', align: 'center' },
        { width: '8%', align: 'center' },
        { width: '10%' },
        { width: '5%', align: 'center' },
        { width: '5%', align: 'center' },
    ];

    return (
        <div className="pageInner">
            <div className="pageHeadWrap flex items-end justify-between">
                <div className="pageTitle">
                    <h2 className="pageHead">역할/권한 관리</h2>
                    <p className="pageDescription">
                        역할을 정의하고 각 역할에 권한을 할당합니다
                    </p>
                </div>
                <Button
                    className="contentPlus"
                    onClick={() => navigate('/roles/new')}
                >
                    <Plus className="size-5" />
                    역할 추가
                </Button>
            </div>

            <div className="tableInner border rounded-lg">
                <DataTable
                    columns={columns}
                    colWidths={colWidths}
                    data={roles}
                    isLoading={isLoading}
                    emptyMessage="등록된 역할이 없습니다. 새 역할을 생성해보세요."
                    onRowClick={(row) => navigate(`/roles/${row.id}/edit`)}
                />
            </div>
        </div>
    );
}

export default RoleList;
