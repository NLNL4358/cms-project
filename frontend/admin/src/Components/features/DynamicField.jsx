/**
 * @description
 * ContentType의 필드 정의에 따라 적절한 UI 컴포넌트를 렌더링하는 동적 필드 컴포넌트.
 * React Hook Form의 Controller를 통해 폼과 연결됩니다.
 */
import { Controller } from 'react-hook-form';
import { Image, FileText, X, RefreshCw } from 'lucide-react';
import { Input } from '@/Components/ui/Input.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import { Switch } from '@/Components/ui/switch.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import RichTextEditor from '@/Components/features/RichTextEditor.jsx';
import { usePopup } from '@/Providers/PopupContext';
import MediaPickerPopup from '@/Components/common/MediaPickerPopup.jsx';
import { getMediaUrl } from '@/lib/media-utils.js';

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
    const { makePopup, closePopup } = usePopup();

    return (
        <div className="flex flex-col gap-2">
            <Label htmlFor={fieldName}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>

            <Controller
                control={control}
                name={fieldName}
                render={({ field }) =>
                    renderField(field, fieldDef, { makePopup, closePopup })
                }
            />

            {fieldError && (
                <p className="text-sm text-destructive">{fieldError.message}</p>
            )}
        </div>
    );
}

function renderField(field, fieldDef, popup) {
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

        case 'multiselect': {
            const selectedValues = Array.isArray(field.value)
                ? field.value
                : typeof field.value === 'string' && field.value
                  ? field.value.split(',').map((s) => s.trim())
                  : [];
            const msOptions = Array.isArray(options) ? options : [];

            if (msOptions.length === 0) {
                return (
                    <p className="text-sm text-muted-foreground">
                        콘텐츠 폼에서 선택 옵션을 정의해주세요
                    </p>
                );
            }

            const toggleOption = (opt) => {
                const next = selectedValues.includes(opt)
                    ? selectedValues.filter((v) => v !== opt)
                    : [...selectedValues, opt];
                field.onChange(next);
            };

            return (
                <div className="flex flex-wrap gap-2">
                    {msOptions.map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(opt)}
                                onChange={() => toggleOption(opt)}
                            />
                            <span className="text-sm">{opt}</span>
                        </label>
                    ))}
                </div>
            );
        }

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
        case 'file': {
            const mode = type === 'image' ? 'image' : 'file';
            const currentUrl = field.value || '';
            const isImg = type === 'image' || currentUrl.match(/\.(jpe?g|png|gif|webp|svg)$/i);

            const openPicker = () => {
                popup.makePopup(
                    <MediaPickerPopup
                        mode={mode}
                        onSelect={(media) => {
                            field.onChange(media.url);
                            popup.closePopup();
                        }}
                        onClose={() => popup.closePopup()}
                    />,
                );
            };

            if (!currentUrl) {
                return (
                    <div className="dynamicFieldMediaEmpty" onClick={openPicker}>
                        {type === 'image' ? (
                            <Image className="size-6 text-muted-foreground" />
                        ) : (
                            <FileText className="size-6 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                            {type === 'image' ? '이미지 선택' : '파일 선택'}
                        </span>
                    </div>
                );
            }

            return (
                <div className="dynamicFieldMediaPreview">
                    {isImg ? (
                        <img
                            src={getMediaUrl(currentUrl)}
                            alt=""
                            className="dynamicFieldMediaThumb"
                        />
                    ) : (
                        <div className="dynamicFieldMediaThumbIcon">
                            <FileText className="size-5" />
                        </div>
                    )}
                    <span className="dynamicFieldMediaName">
                        {currentUrl.split('/').pop()}
                    </span>
                    <div className="dynamicFieldMediaActions">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={openPicker}
                            title="변경"
                        >
                            <RefreshCw className="size-3.5" />
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => field.onChange('')}
                            title="제거"
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                </div>
            );
        }

        case 'images':
        case 'files': {
            const mode = type === 'images' ? 'image' : 'file';
            const currentList = Array.isArray(field.value) ? field.value : [];

            const addItem = () => {
                popup.makePopup(
                    <MediaPickerPopup
                        mode={mode}
                        onSelect={(media) => {
                            field.onChange([...currentList, media.url]);
                            popup.closePopup();
                        }}
                        onClose={() => popup.closePopup()}
                    />,
                );
            };

            const removeItem = (index) => {
                field.onChange(currentList.filter((_, i) => i !== index));
            };

            return (
                <div className="dynamicFieldMultiMedia">
                    {currentList.map((url, i) => {
                        const isImg = type === 'images' || url.match(/\.(jpe?g|png|gif|webp|svg)$/i);
                        return (
                            <div key={`${url}-${i}`} className="dynamicFieldMediaPreview">
                                {isImg ? (
                                    <img src={getMediaUrl(url)} alt="" className="dynamicFieldMediaThumb" />
                                ) : (
                                    <div className="dynamicFieldMediaThumbIcon">
                                        <FileText className="size-5" />
                                    </div>
                                )}
                                <span className="dynamicFieldMediaName">{url.split('/').pop()}</span>
                                <Button type="button" variant="outline" size="icon-sm" onClick={() => removeItem(i)} title="제거">
                                    <X className="size-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                    <div className="dynamicFieldMediaEmpty" onClick={addItem}>
                        {type === 'images' ? (
                            <Image className="size-6 text-muted-foreground" />
                        ) : (
                            <FileText className="size-6 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                            {type === 'images' ? '이미지 추가' : '파일 추가'}
                        </span>
                    </div>
                </div>
            );
        }

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
