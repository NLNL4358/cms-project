/**
 * @description
 * 헤더 검색 아이콘 + 드롭다운
 * 벨 아이콘 왼쪽에 위치, 클릭하면 검색 입력 + 결과 미리보기
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

import { useUser } from '@/Providers/UserContext.jsx';
import { Input } from '@/Components/ui/Input.jsx';

function SearchBar() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

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

                    {query.length > 0 && (
                        <div className="searchDropdownHint">
                            Enter를 눌러 검색
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchBar;
