/**
 * @description
 * 콘텐츠 생성/수정 폼 페이지.
 * URL의 :contentTypeSlug로 콘텐츠 타입을 식별하고,
 * :id가 있으면 수정 모드, 없으면 생성 모드로 동작합니다.
 * ContentType.fields에 따라 동적으로 폼 필드를 렌더링합니다.
 *
 * Phase 3 추가:
 * - 상태 관리 버튼 (초안 저장 / 발행 / 미발행 전환)
 * - 버전 히스토리 패널 (수정 모드에서만 표시)
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
    ArrowLeft,
    Send,
    Save,
    EyeOff,
    History,
    RotateCcw,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Badge } from '@/Components/ui/badge.jsx';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card.jsx';
import DynamicField from '@/Components/features/DynamicField.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup';
import AlertPopup from '@/Components/common/AlertPopup';
import { buildContentSchema } from '@/lib/content-schema.js';

/** 상태 배지 설정 */
const STATUS_MAP = {
    DRAFT: { label: '초안', variant: 'secondary' },
    REVIEW: { label: '검토 중', variant: 'outline' },
    APPROVED: { label: '승인됨', variant: 'default' },
    PUBLISHED: { label: '발행됨', variant: 'default' },
    REJECTED: { label: '반려됨', variant: 'destructive' },
    ARCHIVED: { label: '보관됨', variant: 'secondary' },
};

function ContentForm() {
    const api = useAPI();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();
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

    // 버전 히스토리 열림/닫힘 상태
    const [showVersions, setShowVersions] = useState(false);

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

    // 버전 히스토리 조회 (수정 모드에서만)
    const { data: versions = [], refetch: refetchVersions } = useQuery({
        queryKey: ['content-versions', id],
        queryFn: () => api.get(`/contents/${id}/versions`).then((r) => r.data),
        enabled: isEdit && showVersions,
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
    const slugValue = watch('slug');

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

    // ─── 뮤테이션 ───

    // 저장 (초안)
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
            makePopup(
                <AlertPopup
                    title="저장 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 저장 후 발행 (생성 모드: 생성 → 발행 / 수정 모드: 저장 → 발행)
    const saveAndPublishMutation = useMutation({
        mutationFn: async (formData) => {
            const payload = {
                contentTypeId: contentType.id,
                title: formData.title,
                slug: formData.slug,
                data: formData.data,
            };

            let contentId = id;

            // 저장 먼저 수행
            if (isEdit) {
                await api.patch(`/contents/${id}`, payload);
            } else {
                const res = await api.post('/contents', payload);
                contentId = res.data.id;
            }

            // 발행 호출
            return api.post(`/contents/${contentId}/publish`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] });
            navigate(`/contents/${contentTypeSlug}`);
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '발행에 실패했습니다';
            makePopup(
                <AlertPopup
                    title="발행 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 미발행으로 전환
    const unpublishMutation = useMutation({
        mutationFn: () => api.post(`/contents/${id}/unpublish`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contents'] });
            queryClient.invalidateQueries({ queryKey: ['contents', id] });
            makePopup(
                <AlertPopup
                    title="미발행 완료"
                    body={<p>콘텐츠가 초안 상태로 전환되었습니다.</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '미발행 처리에 실패했습니다';
            makePopup(
                <AlertPopup
                    title="미발행 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 버전 복원
    const restoreMutation = useMutation({
        mutationFn: (version) =>
            api.post(`/contents/${id}/versions/${version}/restore`),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['contents', id] });
            queryClient.invalidateQueries({ queryKey: ['content-versions', id] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="복원 완료"
                    body={
                        <p>
                            콘텐츠가 선택한 버전으로 복원되었습니다. (현재 버전:{' '}
                            {res.data.version})
                        </p>
                    }
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '복원에 실패했습니다';
            closePopup();
            makePopup(
                <AlertPopup
                    title="복원 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // ─── 핸들러 ───

    // 초안 저장
    const onSaveDraft = (data) => {
        saveMutation.mutate(data);
    };

    // 저장 후 발행
    const onSaveAndPublish = (data) => {
        makePopup(
            <YesNoPopup
                title="콘텐츠 발행"
                body={<p>이 콘텐츠를 저장하고 발행하시겠습니까?</p>}
                buttonText={{ left: '발행', right: '취소' }}
                buttonFunction={{
                    left: () => {
                        closePopup();
                        saveAndPublishMutation.mutate(data);
                    },
                    right: () => closePopup(),
                }}
            />,
        );
    };

    // 미발행 전환
    const handleUnpublish = () => {
        makePopup(
            <YesNoPopup
                title="미발행 전환"
                body={<p>이 콘텐츠를 미발행(초안) 상태로 전환하시겠습니까?</p>}
                buttonText={{ left: '미발행 전환', right: '취소' }}
                buttonFunction={{
                    left: () => {
                        closePopup();
                        unpublishMutation.mutate();
                    },
                    right: () => closePopup(),
                }}
            />,
        );
    };

    // 버전 복원 확인
    const handleRestore = (version) => {
        makePopup(
            <YesNoPopup
                title="버전 복원"
                body={
                    <p>
                        버전 {version}으로 복원하시겠습니까?
                        <br />
                        <span className="text-sm text-muted-foreground">
                            현재 내용이 선택한 버전의 데이터로 교체됩니다.
                        </span>
                    </p>
                }
                buttonText={{ left: '복원', right: '취소' }}
                buttonFunction={{
                    left: () => restoreMutation.mutate(version),
                    right: () => closePopup(),
                }}
            />,
        );
    };

    // 현재 상태 정보
    const currentStatus = existingContent?.status || 'DRAFT';
    const isPublished = currentStatus === 'PUBLISHED';
    const statusConfig = STATUS_MAP[currentStatus] || {
        label: currentStatus,
        variant: 'secondary',
    };
    const isMutating =
        saveMutation.isPending ||
        saveAndPublishMutation.isPending ||
        unpublishMutation.isPending;

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
        <div className="formPageWrap">
            {/* 페이지 헤더 */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="backButton"
                    onClick={() => navigate(`/contents/${contentTypeSlug}`)}
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">
                            {isEdit
                                ? `${contentType.name} 수정`
                                : `새 ${contentType.name}`}
                        </h2>
                        {/* 수정 모드: 현재 상태 배지 + 버전 */}
                        {isEdit && existingContent && (
                            <div className="flex items-center gap-2">
                                <Badge variant={statusConfig.variant}>
                                    {statusConfig.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    v{existingContent.version}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-1">
                        {isEdit
                            ? `${contentType.name} 콘텐츠를 수정합니다`
                            : `새 ${contentType.name} 콘텐츠를 생성합니다`}
                    </p>
                </div>
            </div>

            <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-6"
            >
                {/* 기본 정보 카드 */}
                <Card>
                    <CardHeader className="border-b">
                        <div className="flex items-center gap-2.5">
                            <div className="sectionTitleBar" />
                            <CardTitle>기본 정보</CardTitle>
                        </div>
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
                            <div className="slugPreviewWrap">
                                <Input
                                    id="slug"
                                    className="font-mono"
                                    placeholder="content-slug"
                                    {...register('slug', {
                                        onChange: () =>
                                            setSlugManuallyEdited(true),
                                    })}
                                />
                                {slugValue && (
                                    <span className="slugPreview">
                                        /{slugValue}
                                    </span>
                                )}
                            </div>
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
                        <CardHeader className="border-b">
                            <div className="flex items-center gap-2.5">
                                <div className="sectionTitleBar" />
                                <CardTitle>입력 항목</CardTitle>
                                {fields.length > 0 && (
                                    <span className="fieldCountBadge">
                                        {fields.length}
                                    </span>
                                )}
                            </div>
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

                {/* 버전 히스토리 카드 (수정 모드에서만) */}
                {isEdit && (
                    <Card>
                        <CardHeader
                            className="cursor-pointer border-b"
                            onClick={() => {
                                setShowVersions(!showVersions);
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="sectionTitleBar" />
                                    <CardTitle className="flex items-center gap-2">
                                        <History className="size-5" />
                                        버전 히스토리
                                    </CardTitle>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {showVersions ? '접기' : '펼치기'}
                                </span>
                            </div>
                        </CardHeader>
                        {showVersions && (
                            <CardContent>
                                {versions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        버전 히스토리가 없습니다.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {versions.map((v) => (
                                            <div
                                                key={v.id}
                                                className="flex items-center justify-between p-3 rounded-lg border"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">
                                                        v{v.version}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {format(
                                                            new Date(
                                                                v.createdAt,
                                                            ),
                                                            'yyyy.MM.dd HH:mm',
                                                            { locale: ko },
                                                        )}
                                                    </span>
                                                    {v.version ===
                                                        existingContent?.version && (
                                                        <Badge variant="secondary">
                                                            현재
                                                        </Badge>
                                                    )}
                                                </div>
                                                {v.version !==
                                                    existingContent?.version && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleRestore(
                                                                v.version,
                                                            )
                                                        }
                                                        disabled={
                                                            restoreMutation.isPending
                                                        }
                                                    >
                                                        <RotateCcw className="size-4 mr-1" />
                                                        복원
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        )}
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

                    {/* 발행된 콘텐츠: 미발행 전환 버튼 */}
                    {isEdit && isPublished && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleUnpublish}
                            disabled={isMutating}
                        >
                            <EyeOff className="size-4 mr-1.5" />
                            미발행 전환
                        </Button>
                    )}

                    {/* 초안 저장 */}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSubmit(onSaveDraft)}
                        disabled={isMutating}
                    >
                        <Save className="size-4 mr-1.5" />
                        {saveMutation.isPending
                            ? '저장 중...'
                            : isEdit
                              ? '저장'
                              : '초안 저장'}
                    </Button>

                    {/* 발행 버튼 (발행되지 않은 상태에서만) */}
                    {!isPublished && (
                        <Button
                            type="button"
                            onClick={handleSubmit(onSaveAndPublish)}
                            disabled={isMutating}
                        >
                            <Send className="size-4 mr-1.5" />
                            {saveAndPublishMutation.isPending
                                ? '발행 중...'
                                : '발행'}
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default ContentForm;
