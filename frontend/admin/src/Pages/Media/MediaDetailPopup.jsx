/**
 * @description
 * 파일 상세/편집 팝업 컨텐츠.
 * PopupProvider의 makePopup() 안에 렌더링된다.
 * 파일 프리뷰, 메타데이터 표시, alt/caption 편집, URL 복사, 원본보기, 삭제를 제공한다.
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
    Trash2,
    Copy,
    Check,
    ExternalLink,
    X,
    Image,
    FileText,
    Film,
    Music,
    File,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import { Label } from '@/Components/ui/label.jsx';
import { Textarea } from '@/Components/ui/textarea.jsx';
import { getMediaUrl, formatFileSize } from '@/lib/media-utils.js';

/** MIME 타입에 맞는 아이콘 반환 */
function getTypeIcon(mimeType) {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    return FileText;
}

/**
 * @param {Object} props
 * @param {Object} props.media - 미디어 객체 (초기 시드)
 * @param {Function} props.onClose - 닫기 콜백 (closePopup)
 * @param {Function} props.onDelete - 삭제 요청 콜백 (mediaItem 전달)
 */
function MediaDetailPopup({ media, onClose, onDelete }) {
    const api = useAPI();
    const queryClient = useQueryClient();

    const [alt, setAlt] = useState(media.alt || '');
    const [caption, setCaption] = useState(media.caption || '');
    const [copied, setCopied] = useState(false);

    // 최신 데이터 fetch
    const { data: freshMedia } = useQuery({
        queryKey: ['media', media.id],
        queryFn: () => api.get(`/media/${media.id}`).then((r) => r.data),
        initialData: media,
    });

    // 최신 데이터로 폼 동기화
    useEffect(() => {
        if (freshMedia) {
            setAlt(freshMedia.alt || '');
            setCaption(freshMedia.caption || '');
        }
    }, [freshMedia]);

    // 메타데이터 저장
    const updateMutation = useMutation({
        mutationFn: (data) => api.patch(`/media/${media.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            onClose();
        },
    });

    // URL 복사
    const handleCopyUrl = () => {
        const fullUrl = getMediaUrl(freshMedia.url);
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 원본 보기
    const handleViewOriginal = () => {
        window.open(getMediaUrl(freshMedia.url), '_blank');
    };

    const TypeIcon = getTypeIcon(freshMedia.mimeType);
    const isImage = freshMedia.mimeType?.startsWith('image/');

    return (
        <>
            {/* 헤더 */}
            <div className="mediaPopupHeader">
                <h4 className="mediaPopupTitle">파일 상세</h4>
                <button
                    type="button"
                    className="mediaPopupClose"
                    onClick={onClose}
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* 본문 */}
            <div className="mediaPopupBody">
                {/* 프리뷰 */}
                <div className="mediaPopupPreview">
                    {isImage ? (
                        <img
                            src={getMediaUrl(
                                freshMedia.thumbnails?.lg || freshMedia.url,
                            )}
                            alt={freshMedia.alt || freshMedia.originalName}
                        />
                    ) : (
                        <div className="mediaPopupFileIcon">
                            <TypeIcon className="size-16" />
                        </div>
                    )}
                    {isImage && (
                        <button
                            type="button"
                            className="mediaPopupViewOriginal"
                            onClick={handleViewOriginal}
                        >
                            <ExternalLink className="size-4" />
                            원본 보기
                        </button>
                    )}
                </div>

                {/* 정보 + 편집 */}
                <div className="mediaPopupInfo">
                    {/* 파일 메타데이터 */}
                    <div className="mediaPopupMeta">
                        <div className="mediaPopupMetaRow">
                            <span className="mediaPopupMetaLabel">파일명</span>
                            <span className="mediaPopupMetaValue">
                                {freshMedia.originalName}
                            </span>
                        </div>
                        <div className="mediaPopupMetaRow">
                            <span className="mediaPopupMetaLabel">크기</span>
                            <span className="mediaPopupMetaValue">
                                {formatFileSize(freshMedia.size)}
                            </span>
                        </div>
                        {freshMedia.width && freshMedia.height && (
                            <div className="mediaPopupMetaRow">
                                <span className="mediaPopupMetaLabel">
                                    해상도
                                </span>
                                <span className="mediaPopupMetaValue">
                                    {freshMedia.width} x {freshMedia.height}
                                </span>
                            </div>
                        )}
                        <div className="mediaPopupMetaRow">
                            <span className="mediaPopupMetaLabel">타입</span>
                            <span className="mediaPopupMetaValue">
                                {freshMedia.mimeType}
                            </span>
                        </div>
                        <div className="mediaPopupMetaRow">
                            <span className="mediaPopupMetaLabel">
                                업로드일
                            </span>
                            <span className="mediaPopupMetaValue">
                                {format(
                                    new Date(freshMedia.createdAt),
                                    'yyyy.MM.dd HH:mm',
                                    { locale: ko },
                                )}
                            </span>
                        </div>
                        {freshMedia.uploadedBy && (
                            <div className="mediaPopupMetaRow">
                                <span className="mediaPopupMetaLabel">
                                    업로더
                                </span>
                                <span className="mediaPopupMetaValue">
                                    {freshMedia.uploadedBy.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* URL 복사 */}
                    <div className="mediaPopupUrlRow">
                        <Input
                            value={getMediaUrl(freshMedia.url) || ''}
                            readOnly
                            className="text-xs font-mono"
                        />
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={handleCopyUrl}
                            title="URL 복사"
                        >
                            {copied ? (
                                <Check className="size-4" />
                            ) : (
                                <Copy className="size-4" />
                            )}
                        </Button>
                    </div>

                    {/* 편집 필드 */}
                    <div className="mediaPopupEditFields">
                        <div>
                            <Label htmlFor="media-alt">
                                대체 텍스트 (alt)
                            </Label>
                            <Input
                                id="media-alt"
                                value={alt}
                                onChange={(e) => setAlt(e.target.value)}
                                placeholder="이미지 설명..."
                            />
                        </div>
                        <div>
                            <Label htmlFor="media-caption">캡션</Label>
                            <Textarea
                                id="media-caption"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="캡션 입력..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="mediaPopupFooter">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        onClose();
                        onDelete(freshMedia);
                    }}
                >
                    <Trash2 className="size-4" />
                    삭제
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        취소
                    </Button>
                    <Button
                        size="sm"
                        onClick={() =>
                            updateMutation.mutate({ alt, caption })
                        }
                        disabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                </div>
            </div>
        </>
    );
}

export default MediaDetailPopup;
