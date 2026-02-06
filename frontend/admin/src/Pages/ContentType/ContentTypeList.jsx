import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';

import { Button } from '@/Components/ui/Button.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import { DataTable } from '@/Components/common/DataTable.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup';
import AlertPopup from '@/Components/common/AlertPopup';

/**
 * 콘텐츠 타입 목록 페이지
 *
 * 등록된 콘텐츠 타입을 테이블로 표시한다.
 * 생성/편집/삭제 기능을 제공한다.
 */
function ContentTypeList() {
    const api = useAPI();
    const { makePopup, closePopup } = usePopup();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // 콘텐츠 타입 목록 조회
    const { data: contentTypes = [], isLoading } = useQuery({
        queryKey: ['content-types'],
        queryFn: () => api.get('/content-types').then((r) => r.data),
    });

    // 콘텐츠 타입 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/content-types/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-types'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body={<p>콘텐츠 타입이 삭제되었습니다.</p>}
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
            id: 'edit',
            header: '수정',
            cell: ({ row }) => (
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
                                title="콘텐츠 타입 삭제"
                                body={
                                    <>
                                        <p>
                                            {`"${row.original.name}" 콘텐츠 타입을 삭제하시겠습니까?`}
                                        </p>
                                        <p>
                                            이 타입에 연결된 콘텐츠가 있으면
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

    // 테이블 컬럼의 길이와 align방향 colgroup
    const colWidths = [
        {
            width: 'auto',
        },
        {
            width: '15%',
        },
        {
            width: '10%',
        },
        {
            width: '15%',
        },
        {
            width: '5%',
            align: 'center',
        },
        {
            width: '5%',
            align: 'center',
        },
    ];

    return (
        <div className="pageInner">
            {/* 페이지 헤더 */}
            <div className="pageHeadWrap flex items-end justify-between">
                <div className="pageTitle">
                    <h2 className="pageHead">콘텐츠 타입</h2>
                    <p className="pageDescription">
                        콘텐츠의 구조를 정의하는 타입을 관리합니다
                    </p>
                </div>
                <Button
                    className="contentPlus"
                    onClick={() => navigate('/content-types/new')}
                >
                    <Plus className="size-5" />
                    콘텐츠 타입 추가
                </Button>
            </div>

            {/* 데이터 테이블 */}
            <div className="tableInner border rounded-lg">
                <DataTable
                    columns={columns}
                    colWidths={colWidths}
                    data={contentTypes}
                    isLoading={isLoading}
                    emptyMessage="등록된 콘텐츠 타입이 없습니다. 새 콘텐츠 타입을 생성해보세요."
                    onRowClick={(row) =>
                        navigate(`/content-types/${row.id}/edit`)
                    }
                />
            </div>
        </div>
    );
}

export default ContentTypeList;
