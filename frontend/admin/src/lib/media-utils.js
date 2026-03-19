/**
 * 미디어 관련 유틸리티 함수
 */

/** 미디어 파일의 전체 URL 생성 */
export function getMediaUrl(path) {
    if (!path) return null;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${baseUrl}${path}`;
}

/** 파일 크기를 읽기 쉬운 형태로 변환 */
export function formatFileSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** MIME 타입을 한국어 라벨로 변환 */
export function getTypeLabel(mimeType) {
    if (!mimeType) return '기타';
    if (mimeType.startsWith('image/')) return '이미지';
    if (mimeType.startsWith('video/')) return '영상';
    if (mimeType.startsWith('audio/')) return '오디오';
    if (mimeType.startsWith('application/pdf') || mimeType.startsWith('text/'))
        return '문서';
    return '기타';
}
