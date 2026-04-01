/**
 * @description
 * 사용자(관리자/회원) 목록 페이지
 * 검색, 타입 필터, 페이지네이션을 지원합니다.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { useUser } from '@/Providers/UserContext.jsx';

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

const TYPE_MAP = {
    ADMIN: { label: '관리자', variant: 'default' },
    MEMBER: { label: '회원', variant: 'secondary' },
};

function UserList() {
    const api = useAPI();
    const { makePopup, closePopup } = usePopup();
    const { user: currentUser } = useUser();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);

    const { data: result, isLoading } = useQuery({
        queryKey: ['users', typeFilter, search, page],
        queryFn: () => {
            const params = new URLSearchParams();
            if (typeFilter !== 'all') params.set('type', typeFilter);
            if (search) params.set('search', search);
            params.set('page', String(page));
            params.set('limit', '20');
            return api.get(`/users?${params}`).then((r) => r.data);
        },
    });

    const users = result?.data || [];
    const meta = result?.meta || { total: 0, page: 1, totalPages: 1 };

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body={<p>사용자가 삭제되었습니다.</p>}
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

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const columns = [
        {
            accessorKey: 'name',
            header: '이름',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.name}</span>
            ),
        },
        {
            accessorKey: 'email',
            header: '이메일',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {row.original.email}
                </span>
            ),
        },
        {
            accessorKey: 'type',
            header: '타입',
            cell: ({ row }) => {
                const cfg = TYPE_MAP[row.original.type] || {
                    label: row.original.type,
                    variant: 'secondary',
                };
                return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
            },
        },
        {
            id: 'roles',
            header: '역할',
            cell: ({ row }) => {
                const roles = row.original.roles || [];
                if (roles.length === 0)
                    return (
                        <span className="text-muted-foreground">없음</span>
                    );
                return (
                    <div className="flex gap-1 flex-wrap">
                        {roles.map((r) => (
                            <Badge key={r.id} variant="outline">
                                {r.name}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: '상태',
            cell: ({ row }) =>
                row.original.isActive ? (
                    <div className="flex items-center gap-1 text-green-600">
                        <UserCheck className="size-4" />
                        <span className="text-sm">활성</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <UserX className="size-4" />
                        <span className="text-sm">비활성</span>
                    </div>
                ),
        },
        {
            accessorKey: 'createdAt',
            header: '가입일',
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
                        navigate(`/users/${row.original.id}/edit`);
                    }}
                >
                    <Pencil className="size-4" />
                </Button>
            ),
        },
        {
            id: 'delete',
            header: '삭제',
            cell: ({ row }) => {
                const isSelf = row.original.id === currentUser?.id;
                return (
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isSelf}
                        onClick={(e) => {
                            e.stopPropagation();
                            makePopup(
                                <YesNoPopup
                                    title="사용자 삭제"
                                    body={
                                        <p>{`"${row.original.name}" 사용자를 삭제하시겠습니까?`}</p>
                                    }
                                    buttonText={{
                                        left: '삭제',
                                        right: '취소',
                                    }}
                                    buttonFunction={{
                                        left: () =>
                                            deleteMutation.mutate(
                                                row.original.id,
                                            ),
                                        right: () => closePopup(),
                                    }}
                                />,
                            );
                        }}
                    >
                        <Trash2
                            className={`size-4 ${isSelf ? 'text-muted-foreground' : 'text-destructive'}`}
                        />
                    </Button>
                );
            },
        },
    ];

    const colWidths = [
        { width: 'auto' },
        { width: '20%' },
        { width: '8%', align: 'center' },
        { width: '15%' },
        { width: '8%', align: 'center' },
        { width: '10%' },
        { width: '5%', align: 'center' },
        { width: '5%', align: 'center' },
    ];

    return (
        <div className="pageInner">
            <div className="pageHeadWrap flex items-end justify-between">
                <div className="pageTitle">
                    <h2 className="pageHead">사용자 관리</h2>
                    <p className="pageDescription">
                        관리자 및 회원 계정을 관리합니다
                    </p>
                </div>
                <Button
                    className="contentPlus"
                    onClick={() => navigate('/users/new')}
                >
                    <Plus className="size-5" />
                    사용자 추가
                </Button>
            </div>

            {/* 필터 바 */}
            <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 flex-1">
                    <Input
                        placeholder="이름 또는 이메일 검색..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={handleSearch}
                    >
                        <Search className="size-4" />
                    </Button>
                </div>
                <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                        setTypeFilter(v);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[130px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="ADMIN">관리자</SelectItem>
                        <SelectItem value="MEMBER">회원</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="tableInner border rounded-lg">
                <DataTable
                    columns={columns}
                    colWidths={colWidths}
                    data={users}
                    isLoading={isLoading}
                    emptyMessage="등록된 사용자가 없습니다."
                    onRowClick={(row) => navigate(`/users/${row.id}/edit`)}
                />
            </div>

            {/* 페이지네이션 */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        이전
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {meta.page} / {meta.totalPages}
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
            )}
        </div>
    );
}

export default UserList;
