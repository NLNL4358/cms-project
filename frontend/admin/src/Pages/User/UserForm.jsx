/**
 * @description
 * 사용자 생성/수정 폼
 * URL에 :id가 있으면 수정 모드, 없으면 생성 모드로 동작합니다.
 * 역할 할당, 비밀번호 변경, 활성/비활성 토글을 지원합니다.
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';

/** Zod 스키마 (생성/수정 분기) */
const createSchema = z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    name: z.string().min(1, '이름을 입력하세요'),
    type: z.enum(['ADMIN', 'MEMBER']),
});

const editSchema = z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다'),
    password: z
        .string()
        .optional()
        .refine((v) => !v || v.length >= 8, '비밀번호는 8자 이상이어야 합니다'),
    name: z.string().min(1, '이름을 입력하세요'),
    type: z.enum(['ADMIN', 'MEMBER']),
});

function UserForm() {
    const api = useAPI();
    const { makePopup, closePopup } = usePopup();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEdit = Boolean(id);

    const [isActive, setIsActive] = useState(true);
    const [selectedRoleIds, setSelectedRoleIds] = useState([]);

    // 역할 목록
    const { data: allRoles = [] } = useQuery({
        queryKey: ['roles'],
        queryFn: () => api.get('/roles').then((r) => r.data),
    });

    // 수정 모드: 기존 데이터 로드
    const { data: existingData, isLoading: isLoadingData } = useQuery({
        queryKey: ['users', id],
        queryFn: () => api.get(`/users/${id}`).then((r) => r.data),
        enabled: isEdit,
    });

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(isEdit ? editSchema : createSchema),
        defaultValues: {
            email: '',
            password: '',
            name: '',
            type: 'ADMIN',
        },
        // values 옵션: existingData 도착 시 rhf가 안전하게 동기화. 사용자 입력은 유지됨.
        values: existingData
            ? {
                  email: existingData.email,
                  password: '',
                  name: existingData.name,
                  type: existingData.type,
              }
            : undefined,
    });

    // isActive, selectedRoleIds는 rhf 외부 state라 별도 동기화
    useEffect(() => {
        if (existingData) {
            setIsActive(existingData.isActive);
            setSelectedRoleIds((existingData.roles || []).map((r) => r.id));
        }
    }, [existingData]);

    // 역할 토글
    const toggleRole = (roleId) => {
        setSelectedRoleIds((prev) =>
            prev.includes(roleId)
                ? prev.filter((id) => id !== roleId)
                : [...prev, roleId],
        );
    };

    // 저장
    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                isActive,
                roleIds: selectedRoleIds,
            };
            // 수정 모드에서 비밀번호 빈칸이면 제거
            if (isEdit && !payload.password) {
                delete payload.password;
            }
            if (isEdit) {
                return api.patch(`/users/${id}`, payload);
            }
            return api.post('/users', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            makePopup(
                <AlertPopup
                    title={isEdit ? '수정 완료' : '생성 완료'}
                    body={isEdit ? '사용자 정보가 수정되었습니다.' : '사용자가 생성되었습니다.'}
                    buttonFunction={() => {
                        closePopup();
                        navigate('/users');
                    }}
                />,
            );
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '저장에 실패했습니다';
            makePopup(
                <AlertPopup
                    title="저장 실패"
                    body={message}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    const onSubmit = (data) => {
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
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="backButton"
                        onClick={() => navigate('/users')}
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">
                        {isEdit ? '사용자 수정' : '새 사용자'}
                    </h2>
                </div>
                <div>
                    <p className="pageDescription">
                        {isEdit
                            ? '사용자 정보와 역할을 수정합니다'
                            : '새 사용자를 생성하고 역할을 할당합니다'}
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
                                이름{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="예: 홍길동"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <Label htmlFor="email">
                                이메일{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="예: editor@cms.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <Label htmlFor="password">
                                비밀번호{' '}
                                {!isEdit && (
                                    <span className="text-destructive">*</span>
                                )}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={
                                    isEdit
                                        ? '변경 시에만 입력'
                                        : '8자 이상 입력'
                                }
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                            {isEdit && (
                                <p className="helpText text-muted-foreground">
                                    빈칸으로 두면 기존 비밀번호가 유지됩니다.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>사용자 타입</Label>
                            <Select
                                value={undefined}
                                onValueChange={(v) => setValue('type', v)}
                                defaultValue={
                                    existingData?.type || 'ADMIN'
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">
                                        관리자
                                    </SelectItem>
                                    <SelectItem value="MEMBER">
                                        회원
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isEdit && (
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>계정 상태</Label>
                                    <p className="helpText text-muted-foreground">
                                        비활성화하면 로그인이 차단됩니다.
                                    </p>
                                </div>
                                <Switch
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 역할 할당 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>역할 할당</h5>
                        {selectedRoleIds.length > 0 && (
                            <span className="fieldCountBadge">
                                {selectedRoleIds.length}
                            </span>
                        )}
                    </div>

                    {allRoles.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            등록된 역할이 없습니다. 먼저 역할을 생성하세요.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {allRoles.map((role) => {
                                const selected = selectedRoleIds.includes(
                                    role.id,
                                );
                                return (
                                    <div
                                        key={role.id}
                                        className={`permActionBtn${selected ? ' permActionBtnActive' : ''}`}
                                        onClick={() => toggleRole(role.id)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div>
                                            <span
                                                style={{
                                                    fontWeight: 500,
                                                    marginRight: 8,
                                                }}
                                            >
                                                {role.name}
                                            </span>
                                            {role.description && (
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        color: 'var(--muted-foreground)',
                                                    }}
                                                >
                                                    {role.description}
                                                </span>
                                            )}
                                        </div>
                                        {selected && (
                                            <Badge variant="default">
                                                선택됨
                                            </Badge>
                                        )}
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
                        onClick={() => navigate('/users')}
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

export default UserForm;
