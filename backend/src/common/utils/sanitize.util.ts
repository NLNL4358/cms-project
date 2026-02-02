import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML Sanitize 유틸리티
 *
 * richtext 필드에 포함된 HTML에서 XSS 위험 요소를 제거한다.
 * ContentType의 fields 정의에서 type이 'richtext'인 필드만 대상으로 처리한다.
 *
 * @param data - 콘텐츠 데이터 객체 (예: { title: "...", content: "<p>...</p>" })
 * @param fields - ContentType의 필드 정의 배열 (예: [{ name: "content", type: "richtext", ... }])
 * @returns sanitize 처리된 데이터 객체 (원본 객체를 변경하지 않고 새 객체 반환)
 */
export function sanitizeContentData(
  data: Record<string, any>,
  fields: any[],
): Record<string, any> {
  if (!data || !fields || !Array.isArray(fields)) {
    return data;
  }

  // richtext 타입 필드명 목록 추출
  const richtextFieldNames = fields
    .filter((field) => field.type === 'richtext')
    .map((field) => field.name);

  // richtext 필드가 없으면 원본 그대로 반환
  if (richtextFieldNames.length === 0) {
    return data;
  }

  // 새 객체 생성 후 richtext 필드만 sanitize
  const sanitized = { ...data };

  for (const fieldName of richtextFieldNames) {
    if (
      sanitized[fieldName] !== undefined &&
      sanitized[fieldName] !== null &&
      typeof sanitized[fieldName] === 'string'
    ) {
      sanitized[fieldName] = DOMPurify.sanitize(sanitized[fieldName], {
        // TipTap 에디터 출력에 필요한 태그 허용
        ALLOWED_TAGS: [
          'p',
          'br',
          'strong',
          'em',
          'u',
          's',
          'del',
          'a',
          'ul',
          'ol',
          'li',
          'blockquote',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'code',
          'pre',
          'img',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'hr',
          'span',
          'div',
          'sub',
          'sup',
          'mark',
        ],
        ALLOWED_ATTR: [
          'href',
          'target',
          'rel',
          'src',
          'alt',
          'width',
          'height',
          'class',
          'style',
          'colspan',
          'rowspan',
          'data-type',
          'data-id',
        ],
        // javascript: URI 차단
        ALLOW_DATA_ATTR: false,
      });
    }
  }

  return sanitized;
}
