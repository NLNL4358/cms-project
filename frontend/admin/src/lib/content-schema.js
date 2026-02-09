import { z } from 'zod';

/**
 * ContentType의 fields 배열로 Zod 검증 스키마를 동적으로 생성합니다.
 * @param {Array} fields - [{ name, label, type, required }]
 * @returns {z.ZodObject} - { title, slug, data: { ...dynamicFields } } 스키마
 */
export function buildContentSchema(fields) {
    const dataShape = {};

    for (const field of fields) {
        let fieldSchema;

        switch (field.type) {
            case 'integer':
                fieldSchema = field.required
                    ? z.coerce.number({ invalid_type_error: '숫자를 입력하세요' }).int('정수를 입력하세요')
                    : z.union([z.coerce.number().int('정수를 입력하세요'), z.literal('')]).optional();
                dataShape[field.name] = fieldSchema;
                continue;
            case 'decimal':
                fieldSchema = field.required
                    ? z.coerce.number({ invalid_type_error: '숫자를 입력하세요' })
                    : z.union([z.coerce.number(), z.literal('')]).optional();
                dataShape[field.name] = fieldSchema;
                continue;
            case 'boolean':
                dataShape[field.name] = z.boolean().optional();
                continue;
            case 'email':
                fieldSchema = z.string().email('올바른 이메일을 입력하세요');
                break;
            case 'url':
                fieldSchema = z.string().url('올바른 URL을 입력하세요');
                break;
            case 'json':
                fieldSchema = z.string().refine(
                    (val) => {
                        if (!val) return true;
                        try {
                            JSON.parse(val);
                            return true;
                        } catch {
                            return false;
                        }
                    },
                    { message: '올바른 JSON 형식이 아닙니다' },
                );
                break;
            case 'slug':
                fieldSchema = z.string().regex(
                    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                    '소문자, 숫자, 하이픈만 가능',
                );
                break;
            case 'color':
                fieldSchema = z.string().regex(
                    /^#[0-9a-fA-F]{6}$/,
                    '올바른 색상 코드를 입력하세요 (예: #FF0000)',
                );
                break;
            default:
                fieldSchema = z.string();
                break;
        }

        if (field.required) {
            fieldSchema = fieldSchema.min(1, `${field.label}을(를) 입력하세요`);
        } else {
            fieldSchema = fieldSchema.optional().or(z.literal(''));
        }

        dataShape[field.name] = fieldSchema;
    }

    return z.object({
        title: z.string().min(1, '제목을 입력하세요'),
        slug: z
            .string()
            .min(1, '고유주소를 입력하세요')
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, '소문자, 숫자, 하이픈만 가능'),
        data: z.object(dataShape),
    });
}
