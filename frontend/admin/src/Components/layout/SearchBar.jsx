/**
 * @description
 * 헤더 검색 아이콘 + 드롭다운
 * 벨 아이콘 왼쪽에 위치, 클릭하면 검색 입력 + 결과 미리보기
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useUser } from '@/Providers/UserContext.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import SearchResultItem from '@/Components/features/SearchResultItem.jsx';

function SearchBar() {
    const api = useAPI();
    const { user } = useUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // 검색 쿼리 (300ms 디바운스 대신 Enter/최소 2자)
    const { data: searchData, isLoading } = useQuery({
        queryKey: ['search-preview', query],
        queryFn: () =>
            api.get(`/search?q=${encodeURIComponent(query)}&limit=5`).then((r) => r.data),
        enabled: !!user && query.length >= 2,
    });

    const results = searchData?.data || [];

    // 열릴 때 포커스
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    // 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim()) {
            setOpen(false);
            navigate(`/search?q=${encodeURIComponent(query)}`);
        }
        if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const handleViewAll = () => {
        setOpen(false);
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="searchBarWrap" ref={dropdownRef}>
            <button
                className="searchBarBtn"
                onClick={() => setOpen(!open)}
                title="검색"
            >
                <Search className="size-5" />
            </button>

            {open && (
                <div className="searchDropdown">
                    <div className="searchDropdownInput">
                        <Search className="size-4 searchDropdownIcon" />
                        <Input
                            ref={inputRef}
                            placeholder="콘텐츠 검색..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="searchDropdownField"
                        />
                        {query && (
                            <button
                                className="searchDropdownClear"
                                onClick={() => setQuery('')}
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {query.length >= 2 && (
                        <div className="searchDropdownResults">
                            {isLoading ? (
                                <div className="searchDropdownEmpty">
                                    검색 중...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="searchDropdownEmpty">
                                    검색 결과가 없습니다
                                </div>
                            ) : (
                                <>
                                    {results.map((item) => (
                                        <SearchResultItem
                                            key={item.id}
                                            item={item}
                                        />
                                    ))}
                                    {searchData?.meta?.total > 5 && (
                                        <button
                                            className="searchViewAll"
                                            onClick={handleViewAll}
                                        >
                                            전체 {searchData.meta.total}건 보기
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchBar;
