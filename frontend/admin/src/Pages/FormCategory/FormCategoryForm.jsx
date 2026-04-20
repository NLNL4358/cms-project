/**
 * @description
 * 콘텐츠 폼 카테고리 생성/수정 폼
 * URL에 :id가 있으면 수정 모드, 없으면 생성 모드로 동작합니다.
 */
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';

import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import AlertPopup from '@/Components/common/AlertPopup';

/** Zod 검증 스키마 */
const categorySchema = z.object({
    name: z.string().min(1, '카테고리 이름을 입력하세요'),
    description: z.string().optional(),
    order: z.coerce.number().int().min(0, '0 이상의 숫자를 입력하세요'),
});

function FormCategoryForm() {
    const api = useAPI();
    const { makePopup, closePopup } = usePopup();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // 수정 모드: 기존 데이터 로드
    const {
        data: existingData,
        isLoading: isLoadingData,
        error: loadError,
    } = useQuery({
        queryKey: ['form-categories', id],
        queryFn: () => api.get(`/form-categories/${id}`).then((r) => r.data),
        enabled: isEdit,
        retry: false,
    });

    // react-hook-form의 values 옵션 — 외부 소스가 바뀌면 폼이 자동 동기화 (reset 수동 호출 불필요)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            description: '',
            order: 0,
        },
        values: existingData
            ? {
                  name: existingData.name,
                  description: existingData.description || '',
                  order: existingData.order ?? 0,
              }
            : undefined,
    });

    const showError = (message) => {
        makePopup(
            <AlertPopup
                title="저장 실패"
                body={<p>{message}</p>}
                buttonFunction={() => closePopup()}
            />,
        );
    };

    // 저장
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (isEdit) {
                return api.patch(`/form-categories/${id}`, data);
            }
            return api.post('/form-categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-categories'] });
            queryClient.invalidateQueries({ queryKey: ['content-forms'] });
            navigate('/form-categories');
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '저장에 실패했습니다';
            showError(message);
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

    if (isEdit && loadError) {
        return (
            <div className="p-6">
                <div className="text-destructive">
                    카테고리를 불러오지 못했습니다: {loadError?.response?.data?.message || loadError.message}
                </div>
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
                        onClick={() => navigate('/form-categories')}
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">
                        {isEdit ? '카테고리 수정' : '새 카테고리'}
                    </h2>
                </div>
                <div>
                    <p className="pageDescription">
                        {isEdit
                            ? '카테고리의 정보를 수정합니다'
                            : '콘텐츠 폼을 분류할 새 카테고리를 만듭니다'}
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
                                카테고리 이름{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="예: 유저 게시판"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">설명</Label>
                            <Textarea
                                id="description"
                                placeholder="카테고리에 대한 설명을 입력하세요"
                                {...register('description')}
                            />
                        </div>

                        <div className="flex flex-col">
                            <Label htmlFor="order">정렬 순서</Label>
                            <Input
                                id="order"
                                type="number"
                                min="0"
                                placeholder="0"
                                {...register('order')}
                            />
                            <p className="helpText text-muted-foreground">
                                숫자가 작을수록 사이드바 상단에 표시됩니다. (기본값 0)
                            </p>
                            {errors.order && (
                                <p className="text-sm text-destructive">
                                    {errors.order.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/form-categories')}
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

export default FormCategoryForm;
