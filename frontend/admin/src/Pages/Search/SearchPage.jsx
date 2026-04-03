/**
 * @description
 * 검색 결과 페이지 — 전체 결과 + 필터 + 페이지네이션
 */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Search,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import SearchResultItem from '@/Components/features/SearchResultItem.jsx';
import '@/CSS/local/search.css';

function SearchPage() {
    const api = useAPI();
    const { contentTypes } = useGlobal();
    const [searchParams, setSearchParams] = useSearchParams();

    const initialQuery = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(initialQuery);
    const [query, setQuery] = useState(initialQuery);
    const [page, setPage] = useState(1);
    const [contentTypeSlug, setContentTypeSlug] = useState('');
    const [status, setStatus] = useState('');

    const limit = 20;

    const { data, isLoading } = useQuery({
        queryKey: ['search-results', query, page, contentTypeSlug, status],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set('q', query);
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (contentTypeSlug) params.set('contentTypeSlug', contentTypeSlug);
            if (status) params.set('status', status);
            return api.get(`/search?${params}`).then((r) => r.data);
        },
        enabled: query.length >= 1,
    });

    const results = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1 };
    const totalPages = Math.ceil((meta.total || 0) / limit);

    const handleSearch = () => {
        setQuery(searchInput);
        setPage(1);
        setSearchParams({ q: searchInput });
    };

    return (
        <div className="formPageWrap searchPageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <Search className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">검색 결과</h2>
                </div>
            </div>

            {/* 검색 바 */}
            <div className="sectionBox searchFilterBox">
                <div className="searchPageInputWrap">
                    <Input
                        placeholder="검색어를 입력하세요..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSearch();
                        }}
                        className="searchPageInput"
                    />
                    <Button onClick={handleSearch}>
                        <Search className="size-4 mr-1" />
                        검색
                    </Button>
                </div>
                <div className="searchFilterRow">
                    <Select
                        value={contentTypeSlug || 'all'}
                        onValueChange={(v) => {
                            setContentTypeSlug(v === 'all' ? '' : v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="searchFilterSelect">
                            <SelectValue placeholder="콘텐츠 타입 전체" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">콘텐츠 타입 전체</SelectItem>
                            {contentTypes.map((ct) => (
                                <SelectItem key={ct.slug} value={ct.slug}>
                                    {ct.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={status || 'all'}
                        onValueChange={(v) => {
                            setStatus(v === 'all' ? '' : v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="searchFilterSelect">
                            <SelectValue placeholder="상태 전체" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">상태 전체</SelectItem>
                            <SelectItem value="DRAFT">초안</SelectItem>
                            <SelectItem value="PUBLISHED">발행됨</SelectItem>
                            <SelectItem value="ARCHIVED">보관됨</SelectItem>
                        </SelectContent>
                    </Select>
                    {meta.total > 0 && (
                        <span className="searchResultCount">
                            {meta.total}건 검색됨
                            {meta.processingTimeMs !== undefined &&
                                ` (${meta.processingTimeMs}ms)`}
                        </span>
                    )}
                </div>
            </div>

            {/* 결과 목록 */}
            <div className="sectionBox">
                {!query ? (
                    <div className="searchEmpty">
                        <Search className="size-10 text-muted-foreground" />
                        <p>검색어를 입력하세요</p>
                    </div>
                ) : isLoading ? (
                    <div className="searchEmpty">검색 중...</div>
                ) : results.length === 0 ? (
                    <div className="searchEmpty">
                        <Search className="size-10 text-muted-foreground" />
                        <p>"{query}"에 대한 검색 결과가 없습니다</p>
                    </div>
                ) : (
                    <div className="searchResultList">
                        {results.map((item) => (
                            <SearchResultItem key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="searchPagination">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="searchPageInfo">
                        {page} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default SearchPage;
