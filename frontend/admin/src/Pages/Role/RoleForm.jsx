/**
 * @description
 * 역할 생성/수정 폼
 * URL에 :id가 있으면 수정 모드, 없으면 생성 모드로 동작합니다.
 * 권한은 리소스별 그룹 체크박스로 선택합니다.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import '@/CSS/local/role.css';

/** 권한 그룹 정의 */
const PERMISSION_GROUPS = [
    {
        resource: 'content',
        label: '콘텐츠',
        actions: [
            { value: 'content:read', label: '조회' },
            { value: 'content:create', label: '생성' },
            { value: 'content:update', label: '수정' },
            { value: 'content:delete', label: '삭제' },
            { value: 'content:publish', label: '발행' },
        ],
    },
    {
        resource: 'content-type',
        label: '콘텐츠 타입',
        actions: [
            { value: 'content-type:read', label: '조회' },
            { value: 'content-type:create', label: '생성' },
            { value: 'content-type:update', label: '수정' },
            { value: 'content-type:delete', label: '삭제' },
        ],
    },
    {
        resource: 'media',
        label: '파일 관리',
        actions: [
            { value: 'media:read', label: '조회' },
            { value: 'media:create', label: '업로드' },
            { value: 'media:update', label: '수정' },
            { value: 'media:delete', label: '삭제' },
        ],
    },
    {
        resource: 'user',
        label: '사용자',
        actions: [
            { value: 'user:read', label: '조회' },
            { value: 'user:create', label: '생성' },
            { value: 'user:update', label: '수정' },
            { value: 'user:delete', label: '삭제' },
        ],
    },
    {
        resource: 'role',
        label: '역할',
        actions: [
            { value: 'role:read', label: '조회' },
            { value: 'role:create', label: '생성' },
            { value: 'role:update', label: '수정' },
            { value: 'role:delete', label: '삭제' },
        ],
    },
];

/** Zod 검증 스키마 */
const roleSchema = z.object({
    name: z.string().min(1, '역할 이름을 입력하세요'),
    slug: z
        .string()
        .min(1, '고유주소를 입력하세요')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '소문자, 숫자, 하이픈만 가능'),
    description: z.string().optional(),
});

function RoleForm() {
    const api = useAPI();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [superAdmin, setSuperAdmin] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
        },
    });

    const nameValue = watch('name');
    const slugValue = watch('slug');

    // 수정 모드: 기존 데이터 로드
    const { data: existingData, isLoading: isLoadingData } = useQuery({
        queryKey: ['roles', id],
        queryFn: () => api.get(`/roles/${id}`).then((r) => r.data),
        enabled: isEdit,
    });

    // 기존 데이터로 폼 초기화
    useEffect(() => {
        if (existingData) {
            reset({
                name: existingData.name,
                slug: existingData.slug,
                description: existingData.description || '',
            });
            setSlugManuallyEdited(true);

            const perms = Array.isArray(existingData.permissions)
                ? existingData.permissions
                : [];

            if (perms.includes('*')) {
                setSuperAdmin(true);
                setSelectedPermissions([]);
            } else {
                setSuperAdmin(false);
                setSelectedPermissions(perms);
            }
        }
    }, [existingData, reset]);

    // 이름 → 슬러그 자동 생성
    useEffect(() => {
        if (!slugManuallyEdited && !isEdit && nameValue) {
            const slug = nameValue
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            setValue('slug', slug, { shouldValidate: false });
        }
    }, [nameValue, slugManuallyEdited, isEdit, setValue]);

    // 권한 토글
    const togglePermission = (permission) => {
        setSelectedPermissions((prev) =>
            prev.includes(permission)
                ? prev.filter((p) => p !== permission)
                : [...prev, permission],
        );
    };

    // 리소스 전체 선택/해제
    const toggleResourceAll = (group) => {
        const allValues = group.actions.map((a) => a.value);
        const wildcardPerm = `${group.resource}:*`;
        const hasWildcard = selectedPermissions.includes(wildcardPerm);

        if (hasWildcard) {
            // 와일드카드 해제
            setSelectedPermissions((prev) =>
                prev.filter((p) => p !== wildcardPerm),
            );
        } else {
            // 와일드카드로 전환 — 개별 권한 제거 후 와일드카드 추가
            setSelectedPermissions((prev) => [
                ...prev.filter((p) => !allValues.includes(p)),
                wildcardPerm,
            ]);
        }
    };

    // 리소스가 전체 선택인지 확인
    const isResourceAll = (group) => {
        return selectedPermissions.includes(`${group.resource}:*`);
    };

    // 개별 권한이 활성인지 확인 (와일드카드 포함)
    const isPermissionActive = (permission, resource) => {
        if (selectedPermissions.includes(`${resource}:*`)) return true;
        return selectedPermissions.includes(permission);
    };

    // 저장
    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                permissions: superAdmin ? ['*'] : selectedPermissions,
            };
            if (isEdit) {
                return api.patch(`/roles/${id}`, payload);
            }
            return api.post('/roles', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            navigate('/roles');
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '저장에 실패했습니다';
            alert(message);
        },
    });

    const onSubmit = (data) => {
        if (!superAdmin && selectedPermissions.length === 0) {
            alert('최소 1개의 권한을 선택하세요');
            return;
        }
        saveMutation.mutate(data);
    };

    if (isEdit && isLoadingData) {
        return (
            <div className="p-6">
                <div className="text-muted-foreground">불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="formPageWrap">
            {/* 페이지 헤더 */}
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="backButton"
                        onClick={() => navigate('/roles')}
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">
                        {isEdit ? '역할 수정' : '새 역할'}
                    </h2>
                </div>
                <div>
                    <p className="pageDescription">
                        {isEdit
                            ? '역할의 정보와 권한을 수정합니다'
                            : '새 역할을 생성하고 권한을 할당합니다'}
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
            >
                {/* 기본 정보 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>기본 정보</h5>
                    </div>
                    <div className="contentColumnWrap">
                        <div className="flex flex-col">
                            <Label htmlFor="name">
                                역할 이름{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="예: 편집자"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <Label htmlFor="slug">
                                고유주소{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="slugPreviewWrap">
                                <Input
                                    id="slug"
                                    className="font-mono"
                                    placeholder="예: editor"
                                    {...register('slug', {
                                        onChange: () =>
                                            setSlugManuallyEdited(true),
                                    })}
                                />
                                {slugValue && (
                                    <span className="slugPreview">
                                        {slugValue}
                                    </span>
                                )}
                            </div>
                            <p className="helpText text-muted-foreground">
                                소문자, 숫자, 하이픈만 가능합니다.
                            </p>
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">설명</Label>
                            <Textarea
                                id="description"
                                placeholder="역할에 대한 설명을 입력하세요"
                                {...register('description')}
                            />
                        </div>
                    </div>
                </div>

                {/* 권한 설정 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>권한 설정</h5>
                    </div>

                    {/* 전체 권한 토글 */}
                    <div className="permSuperAdmin">
                        <div className="permSuperAdminInfo">
                            <span className="permSuperAdminLabel">
                                전체 권한 (슈퍼 관리자)
                            </span>
                            <span className="permSuperAdminDesc">
                                모든 리소스에 대한 모든 권한을 부여합니다
                            </span>
                        </div>
                        <Switch
                            checked={superAdmin}
                            onCheckedChange={setSuperAdmin}
                        />
                    </div>

                    {/* 리소스별 권한 그룹 */}
                    {!superAdmin && (
                        <div className="permGroupList">
                            {PERMISSION_GROUPS.map((group) => {
                                const allSelected = isResourceAll(group);
                                return (
                                    <div
                                        key={group.resource}
                                        className="permGroup"
                                    >
                                        <div className="permGroupHeader">
                                            <span className="permGroupLabel">
                                                {group.label}
                                            </span>
                                            <button
                                                type="button"
                                                className={`permAllBtn${allSelected ? ' permAllBtnActive' : ''}`}
                                                onClick={() =>
                                                    toggleResourceAll(group)
                                                }
                                            >
                                                {allSelected
                                                    ? '전체 해제'
                                                    : '전체 선택'}
                                            </button>
                                        </div>
                                        <div className="permActionList">
                                            {group.actions.map((action) => {
                                                const active =
                                                    isPermissionActive(
                                                        action.value,
                                                        group.resource,
                                                    );
                                                return (
                                                    <button
                                                        key={action.value}
                                                        type="button"
                                                        className={`permActionBtn${active ? ' permActionBtnActive' : ''}`}
                                                        onClick={() => {
                                                            if (!allSelected) {
                                                                togglePermission(
                                                                    action.value,
                                                                );
                                                            }
                                                        }}
                                                        disabled={allSelected}
                                                    >
                                                        {action.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/roles')}
                    >
                        취소
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                        {saveMutation.isPending
                            ? '저장 중...'
                            : isEdit
                              ? '수정'
                              : '생성'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default RoleForm;
