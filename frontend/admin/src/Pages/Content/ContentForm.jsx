/**
 * @description
 * 콘텐츠 생성/수정 폼 페이지.
 * URL의 :contentTypeSlug로 콘텐츠 타입을 식별하고,
 * :id가 있으면 수정 모드, 없으면 생성 모드로 동작합니다.
 * ContentType.fields에 따라 동적으로 폼 필드를 렌더링합니다.
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card.jsx';
import DynamicField from '@/Components/features/DynamicField.jsx';
import { buildContentSchema } from '@/lib/content-schema.js';

function ContentForm() {
    const api = useAPI();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { contentTypeSlug, id } = useParams();
    const { contentTypes } = useGlobal();
    const isEdit = Boolean(id);

    // slug로 콘텐츠 타입 조회
    const contentType = contentTypes.find((ct) => ct.slug === contentTypeSlug);
    const fields = contentType?.fields || [];

    // 동적 Zod 스키마
    const schema = useMemo(() => buildContentSchema(fields), [fields]);

    // 슬러그 수동 편집 여부
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    // data 필드 기본값 생성
    const defaultDataValues = useMemo(() => {
        const defaults = {};
        for (const field of fields) {
            if (field.type === 'boolean') {
                defaults[field.name] = false;
            } else {
                defaults[field.name] = '';
            }
        }
        return defaults;
    }, [fields]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            title: '',
            slug: '',
            data: defaultDataValues,
        },
    });

    // 수정 모드: 기존 데이터 로드
    const { data: existingContent, isLoading: isLoadingContent } = useQuery({
        queryKey: ['contents', id],
        queryFn: () => api.get(`/contents/${id}`).then((r) => r.data),
        enabled: isEdit,
    });

    // 기존 데이터로 폼 초기화
    useEffect(() => {
        if (existingContent) {
            reset({
                title: existingContent.title,
                slug: existingContent.slug,
                data: { ...defaultDataValues, ...(existingContent.data || {}) },
            });
            setSlugManuallyEdited(true);
        }
    }, [existingContent, reset, defaultDataValues]);

    // 제목 → 슬러그 자동 생성 (생성 모드 + 수동 편집 전)
    const titleValue = watch('title');

    useEffect(() => {
        if (!slugManuallyEdited && !isEdit && titleValue) {
            const slug = titleValue
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            setValue('slug', slug, { shouldValidate: false });
        }
    }, [titleValue, slugManuallyEdited, isEdit, setValue]);

    // 저장 뮤테이션
    const saveMutation = useMutation({
        mutationFn: (formData) => {
            const payload = {
                contentTypeId: contentType.id,
                title: formData.title,
                slug: formData.slug,
                data: formData.data,
            };
            if (isEdit) {
                return api.patch(`/contents/${id}`, payload);
            }
            return api.post('/contents', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] });
            navigate(`/contents/${contentTypeSlug}`);
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '저장에 실패했습니다';
            alert(message);
        },
    });

    const onSubmit = (data) => {
        saveMutation.mutate(data);
    };

    // 콘텐츠 타입 로딩 대기
    if (!contentType) {
        return (
            <div className="p-6">
                <div className="text-muted-foreground">
                    {contentTypes.length === 0
                        ? '불러오는 중...'
                        : '콘텐츠 타입을 찾을 수 없습니다.'}
                </div>
            </div>
        );
    }

    // 수정 모드 데이터 로딩 중
    if (isEdit && isLoadingContent) {
        return (
            <div className="p-6">
                <div className="text-muted-foreground">불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            {/* 페이지 헤더 */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigate(`/contents/${contentTypeSlug}`)}
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEdit
                            ? `${contentType.name} 수정`
                            : `새 ${contentType.name}`}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEdit
                            ? `${contentType.name} 콘텐츠를 수정합니다`
                            : `새 ${contentType.name} 콘텐츠를 생성합니다`}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* 기본 정보 카드 */}
                <Card>
                    <CardHeader>
                        <CardTitle>기본 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 제목 */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="title">
                                제목{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="콘텐츠 제목"
                                {...register('title')}
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">
                                    {errors.title.message}
                                </p>
                            )}
                        </div>

                        {/* 고유주소 */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="slug">
                                고유주소{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="slug"
                                placeholder="content-slug"
                                {...register('slug', {
                                    onChange: () => setSlugManuallyEdited(true),
                                })}
                            />
                            <p className="text-xs text-muted-foreground">
                                URL에 사용됩니다. 소문자, 숫자, 하이픈만
                                가능합니다.
                            </p>
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug.message}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 입력 항목 카드 */}
                {fields.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>입력 항목</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.map((fieldDef) => (
                                <DynamicField
                                    key={fieldDef.name}
                                    fieldDef={fieldDef}
                                    control={control}
                                    errors={errors}
                                />
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/contents/${contentTypeSlug}`)}
                    >
                        취소
                    </Button>
                    <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                    >
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

export default ContentForm;
