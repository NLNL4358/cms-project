/**
 * @description
 * 파일 선택 팝업.
 * PopupProvider의 makePopup() 안에 렌더링된다.
 * 그리드 브라우징, 검색, 타입 필터, 인라인 업로드, 페이지네이션을 제공한다.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    X,
    Search,
    Upload,
    Image,
    FileText,
    Film,
    Music,
    File,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import { Skeleton } from '@/Components/ui/skeleton.jsx';
import MediaUploadZone from '@/Pages/Media/MediaUploadZone.jsx';
import { getMediaUrl, formatFileSize, getTypeLabel } from '@/lib/media-utils.js';

import '@/CSS/local/media.css';

const LIMIT = 12;

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
 * @param {'image'|'file'} props.mode - 'image': 이미지만, 'file': 전체 타입
 * @param {Function} props.onSelect - 선택 확정 콜백 (media 객체)
 * @param {Function} props.onClose - 팝업 닫기 콜백
 */
function MediaPickerPopup({ mode = 'file', onSelect, onClose }) {
    const api = useAPI();

    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState(mode === 'image' ? 'image' : '');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [uploadOpen, setUploadOpen] = useState(false);

    const { data: response, isLoading } = useQuery({
        queryKey: ['media', 'picker', page, typeFilter, search],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(LIMIT));
            if (typeFilter) params.set('type', typeFilter);
            if (search) params.set('search', search);
            return api.get(`/media?${params}`).then((r) => r.data);
        },
    });

    const items = response?.items || [];
    const meta = response?.meta || { total: 0, page: 1, totalPages: 1 };

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handleConfirm = () => {
        if (selected) {
            onSelect(selected);
        }
    };

    return (
        <>
            {/* 헤더 */}
            <div className="mediaPopupHeader">
                <h4 className="mediaPopupTitle">
                    {mode === 'image' ? '이미지 선택' : '파일 선택'}
                </h4>
                <button
                    type="button"
                    className="mediaPopupClose"
                    onClick={onClose}
                >
                    <X className="size-5" />
                </button>
            </div>

            {/* 본문 */}
            <div className="mediaPickerBody">
                {/* 필터바 */}
                <div className="mediaPickerFilterBar">
                    <div className="mediaSearchWrap">
                        <Input
                            placeholder="파일명 검색..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="pr-9"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            className="mediaSearchBtn"
                        >
                            <Search className="size-4" />
                        </button>
                    </div>

                    {mode === 'file' && (
                        <Select
                            value={typeFilter || 'ALL'}
                            onValueChange={(v) => {
                                setTypeFilter(v === 'ALL' ? '' : v);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="전체 타입" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">전체</SelectItem>
                                <SelectItem value="image">이미지</SelectItem>
                                <SelectItem value="video">영상</SelectItem>
                                <SelectItem value="audio">오디오</SelectItem>
                                <SelectItem value="document">문서</SelectItem>
                            </SelectContent>
                        </Select>
                    )}

                    <div className="flex-1" />

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadOpen((o) => !o)}
                    >
                        <Upload className="size-4" />
                        {uploadOpen ? '닫기' : '업로드'}
                    </Button>
                </div>

                {/* 업로드 영역 */}
                {uploadOpen && (
                    <MediaUploadZone onClose={() => setUploadOpen(false)} />
                )}

                {/* 그리드 */}
                <div className="mediaPickerGrid">
                    {isLoading
                        ? Array.from({ length: 8 }).map((_, i) => (
                              <div
                                  key={`skeleton-${i}`}
                                  className="mediaCard mediaCardSkeleton"
                              >
                                  <div className="mediaCardThumb">
                                      <Skeleton className="w-full h-full" />
                                  </div>
                                  <div className="mediaCardBody">
                                      <Skeleton className="h-3 w-3/4" />
                                  </div>
                              </div>
                          ))
                        : items.length === 0
                          ? (
                              <div className="mediaEmptyState">
                                  <p>파일이 없습니다.</p>
                                  <p className="text-sm mt-1">
                                      업로드 버튼으로 파일을 추가하세요.
                                  </p>
                              </div>
                          )
                          : items.map((media) => {
                              const isImage = media.mimeType?.startsWith('image/');
                              const Icon = getTypeIcon(media.mimeType);
                              const isSelected = selected?.id === media.id;
                              return (
                                  <div
                                      key={media.id}
                                      className={`mediaCard${isSelected ? ' mediaCardSelected' : ''}`}
                                      onClick={() => setSelected(media)}
                                      onDoubleClick={() => onSelect(media)}
                                  >
                                      <div className="mediaCardThumb">
                                          {isImage ? (
                                              <img
                                                  src={getMediaUrl(
                                                      media.thumbnails?.sm || media.url,
                                                  )}
                                                  alt={media.alt || media.originalName}
                                              />
                                          ) : (
                                              <div className="mediaCardIcon">
                                                  <Icon className="size-8" />
                                              </div>
                                          )}
                                      </div>
                                      <div className="mediaCardBody">
                                          <span className="mediaCardName">
                                              {media.originalName}
                                          </span>
                                      </div>
                                  </div>
                              );
                          })}
                </div>

                {/* 페이지네이션 */}
                {meta.totalPages > 1 && (
                    <div className="mediaPickerPagination">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            이전
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {page} / {meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            다음
                        </Button>
                    </div>
                )}
            </div>

            {/* 푸터 */}
            <div className="mediaPopupFooter">
                <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {selected
                        ? selected.originalName
                        : '파일을 선택하세요'}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        취소
                    </Button>
                    <Button
                        size="sm"
                        disabled={!selected}
                        onClick={handleConfirm}
                    >
                        선택
                    </Button>
                </div>
            </div>
        </>
    );
}

export default MediaPickerPopup;
