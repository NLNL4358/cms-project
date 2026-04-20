/**
 * @description
 * 드래그 앤 드롭으로 순서 변경이 가능한 필드 아이템 카드.
 * ContentFormForm의 useFieldArray 항목을 렌더링한다.
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Checkbox } from '@/Components/ui/checkbox.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import { FIELD_TYPES, FIELD_TYPE_MAP } from './ContentFormForm.jsx';

function SortableFieldItem({
    id,
    index,
    register,
    control,
    errors,
    fieldsValues,
    remove,
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const typeValue = fieldsValues?.[index]?.type;
    const typeLabel = FIELD_TYPE_MAP[typeValue];
    const isRequired = fieldsValues?.[index]?.required;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`fieldItemCard${isDragging ? ' fieldItemDragging' : ''}`}
        >
            <div className="fieldItemHeader">
                <div className="fieldItemHeaderLeft">
                    <button
                        type="button"
                        className="fieldGripHandle"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical size={14} className="fieldGripIcon" />
                    </button>
                    <span className="fieldItemIndex">항목 {index + 1}</span>
                    {typeLabel && (
                        <span className="typeBadge" data-type={typeValue}>
                            {typeLabel}
                        </span>
                    )}
                    {isRequired && (
                        <span className="requiredBadge">필수</span>
                    )}
                </div>
                <button
                    type="button"
                    className="fieldDeleteBtn"
                    onClick={() => remove(index)}
                >
                    <X size={13} />
                </button>
            </div>

            <div className="fieldItemBody">
                <div className="grid grid-cols-2 gap-4">
                    {/* 항목 이름 */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`fields.${index}.name`}>
                            항목 이름{' '}
                            <span className="helpText text-muted-foreground font-normal">
                                (영문)
                            </span>
                        </Label>
                        <Input
                            id={`fields.${index}.name`}
                            className="font-mono"
                            placeholder="예: title"
                            {...register(`fields.${index}.name`)}
                        />
                        {errors.fields?.[index]?.name && (
                            <p className="helpText text-xs text-destructive">
                                {errors.fields[index].name.message}
                            </p>
                        )}
                    </div>

                    {/* 표시 이름 */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`fields.${index}.label`}>
                            표시 이름
                        </Label>
                        <Input
                            id={`fields.${index}.label`}
                            placeholder="예: 제목"
                            {...register(`fields.${index}.label`)}
                        />
                        {errors.fields?.[index]?.label && (
                            <p className="text-xs text-destructive">
                                {errors.fields[index].label.message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* 타입 */}
                    <div className="flex flex-col gap-1.5">
                        <Label>종류</Label>
                        <Controller
                            control={control}
                            name={`fields.${index}.type`}
                            render={({ field: f }) => (
                                <Select
                                    value={f.value}
                                    onValueChange={f.onChange}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="종류 선택" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPES.map((ft) => (
                                            <SelectItem
                                                key={ft.value}
                                                value={ft.value}
                                            >
                                                {ft.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.fields?.[index]?.type && (
                            <p className="text-xs text-destructive">
                                {errors.fields[index].type.message}
                            </p>
                        )}
                        {typeValue && (
                            <p className="helpText">
                                {FIELD_TYPES.find((ft) => ft.value === typeValue)?.desc}
                            </p>
                        )}
                    </div>

                    {/* 필수 여부 */}
                    <div className="flex flex-col gap-1.5">
                        <Label>옵션</Label>
                        <div className="h-9 flex items-center">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <Controller
                                    control={control}
                                    name={`fields.${index}.required`}
                                    render={({ field: f }) => (
                                        <Checkbox
                                            id={`fields.${index}.required`}
                                            checked={f.value}
                                            onCheckedChange={f.onChange}
                                        />
                                    )}
                                />
                                <span className="text-sm">필수 항목</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* select/multiselect 옵션 정의 */}
                {(typeValue === 'select' || typeValue === 'multiselect') && (
                    <div className="flex flex-col gap-1.5 mt-3">
                        <Label>선택 옵션 (쉼표로 구분)</Label>
                        <Controller
                            control={control}
                            name={`fields.${index}.options`}
                            render={({ field: f }) => (
                                <Input
                                    placeholder="옵션1, 옵션2, 옵션3"
                                    value={Array.isArray(f.value) ? f.value.join(', ') : (f.value || '')}
                                    onChange={(e) => {
                                        const opts = e.target.value
                                            .split(',')
                                            .map((s) => s.trim())
                                            .filter(Boolean);
                                        f.onChange(opts);
                                    }}
                                />
                            )}
                        />
                        <p className="helpText">
                            드롭다운에 표시될 옵션을 쉼표(,)로 구분하여 입력하세요
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SortableFieldItem;
