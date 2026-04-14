/**
 * @description
 * 검색 결과 항목 컴포넌트 (드롭다운/대시보드/결과 페이지에서 공통 사용)
 */
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useUser } from '@/Providers/UserContext.jsx';

function SearchResultItem({ item }) {
    const navigate = useNavigate();
    const { hasPermission } = useUser();
    const canUpdate = hasPermission('content:update');

    const handleClick = () => {
        if (item.contentTypeSlug) {
            navigate(`/contents/${item.contentTypeSlug}/${item.id}/${canUpdate ? 'edit' : 'view'}`);
        }
    };

    const STATUS_LABELS = {
        DRAFT: '초안',
        PUBLISHED: '발행됨',
        ARCHIVED: '보관됨',
    };

    return (
        <div className="searchResultItem" onClick={handleClick}>
            <div className="searchResultIcon">
                <FileText className="size-4" />
            </div>
            <div className="searchResultText">
                <span
                    className="searchResultTitle"
                    dangerouslySetInnerHTML={{
                        __html: item._formatted?.title || item.title,
                    }}
                />
                <span className="searchResultMeta">
                    {item.contentTypeName}
                    {item.status && ` · ${STATUS_LABELS[item.status] || item.status}`}
                </span>
            </div>
        </div>
    );
}

export default SearchResultItem;
