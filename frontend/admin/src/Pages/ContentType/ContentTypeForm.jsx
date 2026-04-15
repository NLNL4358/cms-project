import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import SortableFieldItem from './SortableFieldItem.jsx';

import "@/CSS/local/content.css"

/** 필드 타입 목록 */
export const FIELD_TYPES = [
    { value: 'text', label: '텍스트', desc: '한 줄 텍스트 입력 (제목, 이름 등)' },
    { value: 'textarea', label: '텍스트 영역', desc: '여러 줄 텍스트 입력 (요약, 메모 등)' },
    { value: 'richtext', label: '텍스트 에디터', desc: '서식 지원 에디터 (본문, 상세 설명 등)' },
    { value: 'integer', label: '정수', desc: '정수 입력 (수량, 순서, 정원 등)' },
    { value: 'decimal', label: '소수', desc: '소수점 숫자 입력 (가격, 비율 등)' },
    { value: 'boolean', label: '예/아니오', desc: '켜기/끄기 토글 (공개 여부, 활성화 등)' },
    { value: 'date', label: '날짜', desc: '날짜 선택 (생년월일, 시작일 등)' },
    { value: 'datetime', label: '날짜/시간', desc: '날짜 + 시간 선택 (일정, 마감 기한 등)' },
    { value: 'email', label: '이메일', desc: '이메일 주소 입력' },
    { value: 'url', label: 'URL', desc: '웹 주소 입력 (링크, 영상 URL 등)' },
    { value: 'select', label: '선택', desc: '미리 정의한 옵션 중 1개 선택 (카테고리 등)' },
    { value: 'multiselect', label: '다중 선택', desc: '미리 정의한 옵션 중 여러 개 선택 (태그 등)' },
    { value: 'image', label: '이미지', desc: '이미지 1장 첨부 (썸네일, 대표 이미지 등)' },
    { value: 'images', label: '이미지 (다중)', desc: '이미지 여러 장 첨부 (갤러리, 슬라이드 등)' },
    { value: 'file', label: '파일', desc: '파일 1개 첨부 (문서, PDF 등)' },
    { value: 'files', label: '파일 (다중)', desc: '파일 여러 개 첨부 (첨부파일 목록 등)' },
    { value: 'json', label: 'JSON', desc: '자유 형식 JSON 데이터 (고급 설정 등)' },
    { value: 'slug', label: '고유주소', desc: 'URL용 고유 식별자 (영문/숫자/하이픈)' },
    { value: 'color', label: '색상', desc: '색상 선택 (테마 색, 배경색 등)' },
];

/** 필드 타입 라벨 검색용 맵 */
export const FIELD_TYPE_MAP = Object.fromEntries(
    FIELD_TYPES.map((ft) => [ft.value, ft.label]),
);

/** Zod 검증 스키마 */
const fieldSchema = z.object({
    name: z
        .string()
        .min(1, '항목 이름을 입력하세요')
        .regex(
            /^[a-zA-Z][a-zA-Z0-9_]*$/,
            '영문자로 시작, 영문/숫자/밑줄만 가능',
        ),
    label: z.string().min(1, '표시 이름을 입력하세요'),
    type: z.string().min(1, '종류를 선택하세요'),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
});

const contentTypeSchema = z.object({
    name: z.string().min(1, '이름을 입력하세요'),
    slug: z
        .string()
        .min(1, '고유주소를 입력하세요')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '소문자, 숫자, 하이픈만 가능'),
    description: z.string().optional(),
    fields: z.array(fieldSchema).min(1, '최소 1개의 입력 항목을 추가하세요'),
});

/**
 * 콘텐츠 타입 생성/수정 폼
 *
 * URL에 :id가 있으면 수정 모드, 없으면 생성 모드로 동작한다.
 */
function ContentTypeForm() {
    const api = useAPI();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEdit = Boolean(id);

    // 슬러그 수동 편집 여부
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(contentTypeSchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            memberWritable: false,
            memberAutoPublish: false,
            useSlug: true,
            useInquiry: false,
            fields: [{ name: '', label: '', type: 'text', required: false, options: [] }],
        },
    });

    const {
        fields: formFields,
        append,
        remove,
        move,
    } = useFieldArray({
        control,
        name: 'fields',
    });

    // dnd-kit 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor),
    );

    // 드래그 종료 핸들러
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = formFields.findIndex((f) => f.id === active.id);
            const newIndex = formFields.findIndex((f) => f.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    // 수정 모드: 기존 데이터 로드
    const { data: existingData, isLoading: isLoadingData } = useQuery({
        queryKey: ['content-types', id],
        queryFn: () => api.get(`/content-types/${id}`).then((r) => r.data),
        enabled: isEdit,
    });

    // 기존 데이터로 폼 초기화
    useEffect(() => {
        if (existingData) {
            const fields = Array.isArray(existingData.fields)
                ? existingData.fields
                : [];
            const opts = (existingData.options || {});
            reset({
                name: existingData.name,
                slug: existingData.slug,
                description: existingData.description || '',
                memberWritable: Boolean(opts.memberWritable),
                memberAutoPublish: Boolean(opts.memberAutoPublish),
                useSlug: opts.useSlug !== false,
                useInquiry: Boolean(opts.useInquiry),
                fields:
                    fields.length > 0
                        ? fields.map((f) => ({
                              name: f.name || '',
                              label: f.label || '',
                              type: f.type || 'text',
                              required: Boolean(f.required),
                              options: Array.isArray(f.options) ? f.options : [],
                          }))
                        : [
                              {
                                  name: '',
                                  label: '',
                                  type: 'text',
                                  required: false,
                              },
                          ],
            });
            setSlugManuallyEdited(true);
        }
    }, [existingData, reset]);

    // 필드 값 실시간 추적 (타입 배지, 필수 배지 표시용)
    const fieldsValues = watch('fields');
    const slugValue = watch('slug');
    const nameValue = watch('name');

    // 이름 → 슬러그 자동 생성 (생성 모드 + 수동 편집 전)
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

    // 저장 뮤테이션
    const saveMutation = useMutation({
        mutationFn: (data) => {
            if (isEdit) {
                return api.patch(`/content-types/${id}`, data);
            }
            return api.post('/content-types', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['content-types'] });
            navigate('/content-types');
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '저장에 실패했습니다';
            alert(message);
        },
    });

    const onSubmit = (data) => {
        const { memberWritable, memberAutoPublish, useSlug, useInquiry, ...rest } = data;
        const payload = {
            ...rest,
            options: {
                memberWritable: Boolean(memberWritable),
                memberAutoPublish: Boolean(memberAutoPublish),
                useSlug: Boolean(useSlug),
                useInquiry: Boolean(useInquiry),
            },
        };
        saveMutation.mutate(payload);
    };

    /** 항목 추가 헬퍼 */
    const appendField = () =>
        append({ name: '', label: '', type: 'text', required: false });

    // 수정 모드 데이터 로딩 중
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
                <div className='flex gap-3 items-center'>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="backButton"
                        onClick={() => navigate('/content-types')}
                    >
                        <ArrowLeft className="size-4" />
                    </Button>
                    <h2 className="text-2xl font-bold">
                        {isEdit ? '콘텐츠 타입 수정' : '새 콘텐츠 타입'}
                    </h2>
                </div>
                <div>
                    <p className="pageDescription">
                        {isEdit
                            ? '콘텐츠 타입의 정보와 입력 항목을 수정합니다'
                            : '콘텐츠의 구조를 정의하는 새 타입을 생성합니다'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
                {/* 기본 정보 카드 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>기본 정보</h5>
                    </div>
                    <div className="contentColumnWrap">
                        {/* 이름 */}
                        <div className="flex flex-col">
                            <Label htmlFor="name">
                                이름{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="예: 블로그 포스트"
                                {...register('name')}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* 고유주소 */}
                        <div className="flex flex-col">
                            <Label htmlFor="slug">
                                고유주소{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <div className="slugPreviewWrap">
                                <Input
                                    id="slug"
                                    className="font-mono"
                                    placeholder="예: blog-post"
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
                            <p className="helpText text-muted-foreground">
                                URL에 사용됩니다. 소문자, 숫자, 하이픈만
                                가능합니다.
                            </p>
                            {errors.slug && (
                                <p className="text-sm text-destructive">
                                    {errors.slug.message}
                                </p>
                            )}
                        </div>

                        {/* 설명 */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">설명</Label>
                            <Textarea
                                id="description"
                                placeholder="콘텐츠 타입에 대한 설명을 입력하세요"
                                {...register('description')}
                            />
                        </div>
                    </div>
                </div>

                {/* 외부 사용자 권한 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>외부 사용자 권한</h5>
                    </div>
                    <div className="contentColumnWrap">
                        <label className="ctOptionRow">
                            <input
                                type="checkbox"
                                {...register('memberWritable')}
                            />
                            <div className="ctOptionText">
                                <span className="ctOptionLabel">
                                    회원이 작성 가능
                                </span>
                                <span className="ctOptionDesc">
                                    체크하면 외부 사이트의 일반 회원이 이 콘텐츠 타입에
                                    글을 작성할 수 있습니다 (예: 게시판, 댓글)
                                </span>
                            </div>
                        </label>
                        <label className="ctOptionRow">
                            <input
                                type="checkbox"
                                {...register('memberAutoPublish')}
                            />
                            <div className="ctOptionText">
                                <span className="ctOptionLabel">
                                    회원 작성 시 자동 발행
                                </span>
                                <span className="ctOptionDesc">
                                    체크하면 회원이 작성한 글이 즉시 발행됩니다.
                                    체크하지 않으면 관리자 검토 후 발행됩니다.
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 콘텐츠 옵션 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>콘텐츠 옵션</h5>
                    </div>
                    <div className="contentColumnWrap">
                        <label className="ctOptionRow">
                            <input
                                type="checkbox"
                                {...register('useSlug')}
                            />
                            <div className="ctOptionText">
                                <span className="ctOptionLabel">
                                    글 작성 시 고유주소(URL) 직접 입력
                                </span>
                                <span className="ctOptionDesc">
                                    체크하면 이 타입의 글을 작성할 때 URL용 고유주소를 직접 입력합니다.
                                    (예: /blog/<strong>react-guide</strong>)
                                    블로그, 매거진처럼 SEO가 중요한 경우 권장합니다.
                                    해제하면 고유주소가 자동 생성되어, 게시판/문의처럼 작성자가 신경 쓸 필요 없는 경우에 적합합니다.
                                </span>
                            </div>
                        </label>
                        <label className="ctOptionRow">
                            <input
                                type="checkbox"
                                {...register('useInquiry')}
                            />
                            <div className="ctOptionText">
                                <span className="ctOptionLabel">
                                    처리 상태 사용
                                </span>
                                <span className="ctOptionDesc">
                                    체크하면 콘텐츠에 처리 상태(접수됨/처리중/처리완료/반려)와
                                    관리자 답변 기능이 활성화됩니다. 문의/신청/상담 게시판에 적합합니다.
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* 입력 항목 정의 */}
                <div className="sectionBox">
                    <div className="sectionTitle">
                        <div className="sectionTitleBar" />
                        <h5>입력 항목 정의</h5>
                        {formFields.length > 0 && (
                            <span className="fieldCountBadge">
                                {formFields.length}
                            </span>
                        )}
                    </div>
                    <div>
                        {errors.fields?.root && (
                            <p className="text-sm text-destructive mb-3">
                                {errors.fields.root.message}
                            </p>
                        )}
                        {errors.fields?.message && (
                            <p className="text-sm text-destructive mb-3">
                                {errors.fields.message}
                            </p>
                        )}

                        {formFields.length === 0 ? (
                            <div className="fieldEmptyState">
                                <div className="fieldEmptyIcon">
                                    <Plus size={20} />
                                </div>
                                <p className="fieldEmptyTitle">
                                    입력 항목이 없습니다
                                </p>
                                <p className="fieldEmptyDescription">
                                    &quot;항목 추가&quot; 버튼을 클릭하여
                                    추가하세요
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="addFieldBtn"
                                    onClick={appendField}
                                >
                                    <Plus className="size-4" />
                                    첫 번째 항목 추가
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-5 space-y-3">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={formFields.map((f) => f.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {formFields.map((field, index) => (
                                            <SortableFieldItem
                                                key={field.id}
                                                id={field.id}
                                                index={index}
                                                register={register}
                                                control={control}
                                                errors={errors}
                                                fieldsValues={fieldsValues}
                                                remove={remove}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>

                                {/* 하단 전체 너비 추가 버튼 */}
                                <button
                                    type="button"
                                    className="addFieldBtnFull"
                                    onClick={appendField}
                                >
                                    <Plus size={14} />
                                    항목 추가
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 하단 버튼 */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/content-types')}
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

export default ContentTypeForm;
