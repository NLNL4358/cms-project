/**
 * @description
 * 콘텐츠 목록 페이지
 * URL 파라미터의 contentTypeSlug로 해당 콘텐츠 타입의 콘텐츠를 표시합니다.
 */
import { useParams } from 'react-router-dom';

function ContentList() {
    const { contentTypeSlug } = useParams();

    return <div>콘텐츠 목록 (타입: {contentTypeSlug})</div>;
}

export default ContentList;
