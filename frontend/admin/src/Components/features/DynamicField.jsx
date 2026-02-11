/**
 * @description
 * ContentType의 필드 정의에 따라 적절한 UI 컴포넌트를 렌더링하는 동적 필드 컴포넌트.
 * React Hook Form의 Controller를 통해 폼과 연결됩니다.
 */
import { Controller } from 'react-hook-form';
import { Input } from '@/Components/ui/Input.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import { Label } from '@/Components/ui/label.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import RichTextEditor from '@/Components/features/RichTextEditor.jsx';

/**
 * @param {Object} props
 * @param {Object} props.fieldDef - 필드 정의 { name, label, type, required, options? }
 * @param {Object} props.control - React Hook Form control
 * @param {Object} props.errors - React Hook Form errors
 */
function DynamicField({ fieldDef, control, errors }) {
    const { name, label, type, required } = fieldDef;
    const fieldName = `data.${name}`;
    const fieldError = errors?.data?.[name];

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={fieldName}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>

            <Controller
                control={control}
                name={fieldName}
                render={({ field }) => renderField(field, fieldDef)}
            />

            {fieldError && (
                <p className="text-sm text-destructive">{fieldError.message}</p>
            )}
        </div>
    );
}

function renderField(field, fieldDef) {
    const { type, label, options } = fieldDef;

    switch (type) {
        case 'text':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder={`${label} 입력`}
                />
            );

        case 'textarea':
            return (
                <Textarea
                    {...field}
                    value={field.value ?? ''}
                    placeholder={`${label} 입력`}
                    rows={4}
                />
            );

        case 'richtext':
            return (
                <RichTextEditor
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={`${label} 입력`}
                />
            );

        case 'integer':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    step="1"
                    placeholder="정수 입력"
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                />
            );

        case 'decimal':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    type="number"
                    step="0.01"
                    placeholder="소수 입력"
                    onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                />
            );

        case 'boolean':
            return (
                <div className="flex items-center gap-2 pt-1">
                    <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                    />
                    <span className="text-sm text-muted-foreground">
                        {field.value ? '예' : '아니오'}
                    </span>
                </div>
            );

        case 'date':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    type="date"
                />
            );

        case 'datetime':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    type="datetime-local"
                />
            );

        case 'email':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    type="email"
                    placeholder="email@example.com"
                />
            );

        case 'url':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    type="url"
                    placeholder="https://"
                />
            );

        case 'slug':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="my-content-slug"
                />
            );

        case 'color':
            return (
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={field.value || '#000000'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                    />
                </div>
            );

        case 'select':
            if (Array.isArray(options) && options.length > 0) {
                return (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            }
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder={`${label} 입력`}
                />
            );

        case 'multiselect':
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="쉼표로 구분하여 입력 (예: 값1, 값2, 값3)"
                />
            );

        case 'json':
            return (
                <Textarea
                    {...field}
                    value={field.value ?? ''}
                    rows={6}
                    placeholder={'{ "key": "value" }'}
                    className="font-mono text-sm"
                />
            );

        case 'image':
        case 'file':
            return (
                <Input
                    value=""
                    disabled
                    placeholder="미디어 관리 기능 추가 후 사용 가능"
                />
            );

        default:
            return (
                <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder={`${label} 입력`}
                />
            );
    }
}

export default DynamicField;
