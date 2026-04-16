/**
 * @description
 * 미디어 관리 페이지.
 * 그리드/테이블 뷰 토글, 검색, 타입 필터, 페이지네이션, 업로드, 상세/삭제를 제공한다.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
    Upload,
    Search,
    Trash2,
    LayoutGrid,
    List,
    Image,
    FileText,
    Film,
    Music,
    File,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';

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
import { DataTable } from '@/Components/common/DataTable.jsx';
import YesNoPopup from '@/Components/common/YesNoPopup';
import AlertPopup from '@/Components/common/AlertPopup';

import MediaUploadZone from './MediaUploadZone.jsx';
import MediaDetailPopup from './MediaDetailPopup.jsx';
import { getMediaUrl, formatFileSize, getTypeLabel } from '@/lib/media-utils.js';

import '@/CSS/local/media.css';

const LIMIT = 20;

/** MIME 타입에 맞는 아이콘 반환 */
function getTypeIcon(mimeType) {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    return FileText;
}

function MediaList() {
    const api = useAPI();
    const queryClient = useQueryClient();
    const { makePopup, closePopup } = usePopup();

    // 상태
    const [page, setPage] = useState(1);
    const [typeFilter, setTypeFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // 미디어 목록 조회
    const { data: response, isLoading } = useQuery({
        queryKey: ['media', page, typeFilter, search],
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

    // 삭제 뮤테이션
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/media/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['media'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 완료"
                    body={<p>파일이 삭제되었습니다.</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const message =
                error.response?.data?.message || '삭제에 실패했습니다';
            closePopup();
            makePopup(
                <AlertPopup
                    title="삭제 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 일괄 삭제 뮤테이션
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids) => {
            await Promise.all(ids.map((id) => api.delete(`/media/${id}`)));
        },
        onSuccess: () => {
            const count = selectedIds.length;
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['media'] });
            closePopup();
            makePopup(
                <AlertPopup
                    title="일괄 삭제 완료"
                    body={<p>{count}개 파일이 삭제되었습니다.</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
        onError: (error) => {
            const message = error.response?.data?.message || '일괄 삭제에 실패했습니다';
            closePopup();
            makePopup(
                <AlertPopup
                    title="일괄 삭제 실패"
                    body={<p>{message}</p>}
                    buttonFunction={() => closePopup()}
                />,
            );
        },
    });

    // 선택 토글
    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === items.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(items.map((i) => i.id));
        }
    };

    // 일괄 삭제 확인 팝업
    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        makePopup(
            <YesNoPopup
                title="파일 일괄 삭제"
                body={
                    <p>
                        선택한 <strong>{selectedIds.length}개</strong> 파일을 삭제하시겠습니까?
                        <br />
                        이 작업은 되돌릴 수 없습니다.
                    </p>
                }
                buttonText={{ left: '삭제', right: '취소' }}
                buttonFunction={{
                    left: () => bulkDeleteMutation.mutate(selectedIds),
                    right: () => closePopup(),
                }}
            />,
        );
    };

    // 삭제 확인 팝업
    const handleDelete = (mediaItem) => {
        makePopup(
            <YesNoPopup
                title="파일 삭제"
                body={
                    <p>{`"${mediaItem.originalName}" 파일을 삭제하시겠습니까?`}</p>
                }
                buttonText={{ left: '삭제', right: '취소' }}
                buttonFunction={{
                    left: () => deleteMutation.mutate(mediaItem.id),
                    right: () => closePopup(),
                }}
            />,
        );
    };

    // 파일 상세 팝업
    const openDetail = (mediaItem) => {
        makePopup(
            <MediaDetailPopup
                media={mediaItem}
                onClose={() => closePopup()}
                onDelete={handleDelete}
            />,
        );
    };

    // 검색 실행
    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    // 테이블 컬럼 정의
    const columns = [
        {
            id: 'select',
            align: 'center',
            header: () => (
                <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={toggleSelectAll}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={selectedIds.includes(row.original.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(row.original.id)}
                />
            ),
        },
        {
            id: 'thumbnail',
            align: 'center',
            header: '',
            cell: ({ row }) => {
                const media = row.original;
                const isImage = media.mimeType?.startsWith('image/');
                if (isImage) {
                    return (
                        <img
                            src={getMediaUrl(media.thumbnails?.sm || media.url)}
                            alt={media.alt || media.originalName}
                            className="mediaTableThumb"
                        />
                    );
                }
                const Icon = getTypeIcon(media.mimeType);
                return (
                    <div className="mediaTableThumbIcon">
                        <Icon className="size-5" />
                    </div>
                );
            },
        },
        {
            accessorKey: 'originalName',
            header: '파일명',
            cell: ({ row }) => (
                <span className="font-medium truncate block max-w-[300px]">
                    {row.original.originalName}
                </span>
            ),
        },
        {
            id: 'type',
            header: '타입',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {getTypeLabel(row.original.mimeType)}
                </span>
            ),
        },
        {
            id: 'size',
            header: '크기',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {formatFileSize(row.original.size)}
                </span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: '업로드일',
            cell: ({ row }) => (
                <span className="text-muted-foreground">
                    {format(new Date(row.original.createdAt), 'yyyy.MM.dd', {
                        locale: ko,
                    })}
                </span>
            ),
        },
        {
            id: 'delete',
            header: '삭제',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row.original);
                    }}
                >
                    <Trash2 className="size-4 text-destructive" />
                </Button>
            ),
        },
    ];

    const colWidths = [
        { width: '40px', align: 'center' },   // 체크박스
        { width: '60px', align: 'center' },   // 썸네일
        { width: 'auto' },                    // 파일명
        { width: '10%' },                     // 타입
        { width: '10%' },                     // 크기
        { width: '12%', align: 'center' },    // 업로드일
        { width: '5%', align: 'center' },     // 삭제
    ];

    return (
        <div className="pageInner">
            {/* 페이지 헤더 */}
            <div className="pageHeadWrap flex items-end justify-between">
                <div className="pageTitle">
                    <h2 className="pageHead">파일 관리</h2>
                    <p className="pageDescription">
                        이미지, 영상, 문서 등 업로드된 파일을 관리합니다
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            disabled={bulkDeleteMutation.isPending}
                        >
                            <Trash2 className="size-4" />
                            선택 {selectedIds.length}개 삭제
                        </Button>
                    )}
                    <Button onClick={() => setUploadOpen((o) => !o)}>
                        <Upload className="size-5" />
                        {uploadOpen ? '업로드 닫기' : '업로드'}
                    </Button>
                </div>
            </div>

            {/* 업로드 영역 */}
            {uploadOpen && (
                <MediaUploadZone onClose={() => setUploadOpen(false)} />
            )}

            {/* 필터바 */}
            <div className="mediaFilterBar">
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

                <Select
                    value={typeFilter || 'ALL'}
                    onValueChange={(v) => {
                        setTypeFilter(v === 'ALL' ? '' : v);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="w-[140px]">
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

                <div className="flex-1" />

                {/* 뷰 토글 */}
                <div className="mediaViewToggle">
                    <button
                        type="button"
                        className={`mediaViewBtn${viewMode === 'grid' ? ' active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="그리드 보기"
                    >
                        <LayoutGrid className="size-4" />
                    </button>
                    <button
                        type="button"
                        className={`mediaViewBtn${viewMode === 'table' ? ' active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="테이블 보기"
                    >
                        <List className="size-4" />
                    </button>
                </div>
            </div>

            {/* 그리드 뷰 */}
            {viewMode === 'grid' && (
                <div className="mediaGrid">
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
                                      <Skeleton className="h-4 w-3/4" />
                                      <Skeleton className="h-3 w-1/2" />
                                  </div>
                              </div>
                          ))
                        : items.length === 0
                          ? (
                              <div className="mediaEmptyState">
                                  <p>등록된 파일이 없습니다.</p>
                                  <p className="text-sm mt-1">
                                      업로드 버튼을 클릭하여 파일을 추가하세요.
                                  </p>
                              </div>
                          )
                          : items.map((media) => {
                              const isImage =
                                  media.mimeType?.startsWith('image/');
                              const Icon = getTypeIcon(media.mimeType);
                              const isSelected = selectedIds.includes(media.id);
                              return (
                                  <div
                                      key={media.id}
                                      className={`mediaCard${isSelected ? ' mediaCardSelected' : ''}`}
                                      onClick={() => openDetail(media)}
                                  >
                                      <input
                                          type="checkbox"
                                          className="mediaCardCheck"
                                          checked={isSelected}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={() => toggleSelect(media.id)}
                                      />
                                      <div className="mediaCardThumb">
                                          {isImage ? (
                                              <img
                                                  src={getMediaUrl(
                                                      media.thumbnails?.md ||
                                                          media.url,
                                                  )}
                                                  alt={
                                                      media.alt ||
                                                      media.originalName
                                                  }
                                              />
                                          ) : (
                                              <div className="mediaCardIcon">
                                                  <Icon className="size-10" />
                                              </div>
                                          )}
                                      </div>
                                      <div className="mediaCardBody">
                                          <span className="mediaCardName">
                                              {media.originalName}
                                          </span>
                                          <div className="mediaCardMeta">
                                              <span className="text-xs text-muted-foreground">
                                                  {formatFileSize(media.size)}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                  {getTypeLabel(
                                                      media.mimeType,
                                                  )}
                                              </span>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                </div>
            )}

            {/* 테이블 뷰 */}
            {viewMode === 'table' && (
                <div className="tableInner border rounded-lg">
                    <DataTable
                        columns={columns}
                        colWidths={colWidths}
                        data={items}
                        isLoading={isLoading}
                        emptyMessage="등록된 파일이 없습니다. 업로드 버튼을 클릭하여 파일을 추가하세요."
                        onRowClick={(row) => openDetail(row)}
                    />
                </div>
            )}

            {/* 페이지네이션 */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <span className="text-sm text-muted-foreground">
                        총 {meta.total}건 중{' '}
                        {(meta.page - 1) * LIMIT + 1}-
                        {Math.min(meta.page * LIMIT, meta.total)}건
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                        >
                            이전
                        </Button>
                        <span className="text-sm">
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
                </div>
            )}

        </div>
    );
}

export default MediaList;
