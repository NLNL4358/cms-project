/**
 * @description
 * 콘텐츠 타입 섹션의 부모 라우트 컴포넌트
 * /content-types 하위의 모든 페이지를 감싸며,
 * 이후 브레드크럼, 데이터 프리페치 등 섹션 공통 로직을 담을 예정입니다.
 */
import { Outlet } from 'react-router-dom';

function ContentTypeRouter() {
    return <Outlet />;
}

export default ContentTypeRouter;
