/**
 * @description
 * 콘텐츠 폼 카테고리 섹션의 부모 라우트 컴포넌트
 * /form-categories 하위의 모든 페이지를 감싸며, 이후 브레드크럼/프리페치 등 섹션 공통 로직을 담습니다.
 */
import { Outlet } from 'react-router-dom';

function FormCategoryRouter() {
    return <Outlet />;
}

export default FormCategoryRouter;
