import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import { Checkbox } from '@/Components/ui/checkbox.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card.jsx';

/** 필드 타입 목록 */
const FIELD_TYPES = [
    { value: 'text', label: '텍스트' },
    { value: 'textarea', label: '텍스트 영역' },
    { value: 'richtext', label: '리치 텍스트' },
    { value: 'integer', label: '정수' },
    { value: 'decimal', label: '소수' },
    { value: 'boolean', label: '불리언' },
    { value: 'date', label: '날짜' },
    { value: 'datetime', label: '날짜/시간' },
    { value: 'email', label: '이메일' },
    { value: 'url', label: 'URL' },
    { value: 'select', label: '선택' },
    { value: 'multiselect', label: '다중 선택' },
    { value: 'image', label: '이미지' },
    { value: 'file', label: '파일' },
    { value: 'json', label: 'JSON' },
    { value: 'slug', label: '슬러그' },
    { value: 'color', label: '색상' },
];

/** Zod 검증 스키마 */
const fieldSchema = z.object({
    name: z
        .string()
        .min(1, '필드명을 입력하세요')
        .regex(
            /^[a-zA-Z][a-zA-Z0-9_]*$/,
            '영문자로 시작, 영문/숫자/밑줄만 가능',
        ),
    label: z.string().min(1, '레이블을 입력하세요'),
    type: z.string().min(1, '타입을 선택하세요'),
    required: z.boolean(),
});

const contentTypeSchema = z.object({
    name: z.string().min(1, '이름을 입력하세요'),
    slug: z
        .string()
        .min(1, '슬러그를 입력하세요')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '소문자, 숫자, 하이픈만 가능'),
    description: z.string().optional(),
    fields: z.array(fieldSchema).min(1, '최소 1개의 필드를 추가하세요'),
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
            fields: [{ name: '', label: '', type: 'text', required: false }],
        },
    });

    const {
        fields: formFields,
        append,
        remove,
    } = useFieldArray({
        control,
        name: 'fields',
    });

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
            reset({
                name: existingData.name,
                slug: existingData.slug,
                description: existingData.description || '',
                fields:
                    fields.length > 0
                        ? fields.map((f) => ({
                              name: f.name || '',
                              label: f.label || '',
                              type: f.type || 'text',
                              required: Boolean(f.required),
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

    // 이름 → 슬러그 자동 생성 (생성 모드 + 수동 편집 전)
    const nameValue = watch('name');

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
        saveMutation.mutate(data);
    };

    // 수정 모드 데이터 로딩 중
    if (isEdit && isLoadingData) {
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
                    onClick={() => navigate('/content-types')}
                >
                    <ArrowLeft className="size-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEdit ? '콘텐츠 타입 수정' : '새 콘텐츠 타입'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEdit
                            ? '콘텐츠 타입의 정보와 필드를 수정합니다'
                            : '콘텐츠의 구조를 정의하는 새 타입을 생성합니다'}
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
                        {/* 이름 */}
                        <div className="flex flex-col gap-2">
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

                        {/* 슬러그 */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="slug">
                                슬러그{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="slug"
                                placeholder="예: blog-post"
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

                        {/* 설명 */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="description">설명</Label>
                            <Textarea
                                id="description"
                                placeholder="콘텐츠 타입에 대한 설명을 입력하세요"
                                {...register('description')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 필드 정의 카드 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>필드 정의</CardTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                append({
                                    name: '',
                                    label: '',
                                    type: 'text',
                                    required: false,
                                })
                            }
                        >
                            <Plus className="size-4" />
                            필드 추가
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {errors.fields?.root && (
                            <p className="text-sm text-destructive">
                                {errors.fields.root.message}
                            </p>
                        )}
                        {errors.fields?.message && (
                            <p className="text-sm text-destructive">
                                {errors.fields.message}
                            </p>
                        )}

                        {formFields.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                필드가 없습니다. &quot;필드 추가&quot; 버튼을
                                클릭하여 필드를 추가하세요.
                            </p>
                        )}

                        {formFields.map((field, index) => (
                            <div
                                key={field.id}
                                className="border rounded-lg p-4 space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        필드 {index + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => remove(index)}
                                    >
                                        <X className="size-4 text-destructive" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* 필드명 */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label
                                            htmlFor={`fields.${index}.name`}
                                        >
                                            필드명 (영문)
                                        </Label>
                                        <Input
                                            id={`fields.${index}.name`}
                                            placeholder="예: title"
                                            {...register(
                                                `fields.${index}.name`,
                                            )}
                                        />
                                        {errors.fields?.[index]?.name && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    errors.fields[index].name
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* 레이블 */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label
                                            htmlFor={`fields.${index}.label`}
                                        >
                                            레이블
                                        </Label>
                                        <Input
                                            id={`fields.${index}.label`}
                                            placeholder="예: 제목"
                                            {...register(
                                                `fields.${index}.label`,
                                            )}
                                        />
                                        {errors.fields?.[index]?.label && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    errors.fields[index].label
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-end">
                                    {/* 타입 */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label>타입</Label>
                                        <Controller
                                            control={control}
                                            name={`fields.${index}.type`}
                                            render={({ field: f }) => (
                                                <Select
                                                    value={f.value}
                                                    onValueChange={f.onChange}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="타입 선택" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {FIELD_TYPES.map(
                                                            (ft) => (
                                                                <SelectItem
                                                                    key={
                                                                        ft.value
                                                                    }
                                                                    value={
                                                                        ft.value
                                                                    }
                                                                >
                                                                    {ft.label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.fields?.[index]?.type && (
                                            <p className="text-xs text-destructive">
                                                {
                                                    errors.fields[index].type
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>

                                    {/* 필수 여부 */}
                                    <div className="flex items-center gap-2 pb-1">
                                        <Controller
                                            control={control}
                                            name={`fields.${index}.required`}
                                            render={({ field: f }) => (
                                                <Checkbox
                                                    id={`fields.${index}.required`}
                                                    checked={f.value}
                                                    onCheckedChange={
                                                        f.onChange
                                                    }
                                                />
                                            )}
                                        />
                                        <Label
                                            htmlFor={`fields.${index}.required`}
                                            className="text-sm font-normal"
                                        >
                                            필수 항목
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

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
