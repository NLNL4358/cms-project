import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/Components/features/AuthGuard.jsx';
import { PermissionGuard } from '@/Components/features/PermissionGuard.jsx';
import AdminLayout from '@/Components/layout/AdminLayout.jsx';

/* Pages */
import Login from '@pages/System/Login.jsx';
import Dashboard from '@pages/Dashboard/Dashboard.jsx';
import ContentTypeList from '@pages/ContentType/ContentTypeList.jsx';
import ContentTypeForm from '@pages/ContentType/ContentTypeForm.jsx';
import FormCategoryList from '@pages/FormCategory/FormCategoryList.jsx';
import FormCategoryForm from '@pages/FormCategory/FormCategoryForm.jsx';
import ContentList from '@pages/Content/ContentList.jsx';
import ContentForm from '@pages/Content/ContentForm.jsx';
import MediaList from '@pages/Media/MediaList.jsx';
import RoleList from '@pages/Role/RoleList.jsx';
import RoleForm from '@pages/Role/RoleForm.jsx';
import UserList from '@pages/User/UserList.jsx';
import UserForm from '@pages/User/UserForm.jsx';
import SettingsPage from '@pages/Settings/SettingsPage.jsx';
import AuditLogList from '@pages/AuditLog/AuditLogList.jsx';
import WebhookList from '@pages/Webhook/WebhookList.jsx';
import ImportExportPage from '@pages/ImportExport/ImportExportPage.jsx';
import SearchPage from '@pages/Search/SearchPage.jsx';
import ApiGuidePage from '@pages/ApiGuide/ApiGuidePage.jsx';
import ApiKeyList from '@pages/ApiKey/ApiKeyList.jsx';
import BackupList from '@pages/Backup/BackupList.jsx';

/* Routers */
import ContentTypeRouter from '@pages/Router/ContentTypeRouter.jsx';
import ContentRouter from '@pages/Router/ContentRouter.jsx';
import MediaRouter from '@pages/Router/MediaRouter.jsx';
import RoleRouter from '@pages/Router/RoleRouter.jsx';
import UserRouter from '@pages/Router/UserRouter.jsx';
import FormCategoryRouter from '@pages/Router/FormCategoryRouter.jsx';

/* CSS */
import '@/CSS/reset.css';
import '@/CSS/index.css';
import '@/CSS/component.css';

/** 권한 래핑 헬퍼 */
function P({ permission, children }) {
    return <PermissionGuard permission={permission}>{children}</PermissionGuard>;
}

function App() {
    return (
        <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={<Login />} />

            {/* 보호된 라우트 — AdminLayout */}
            <Route
                path="/"
                element={
                    <AuthGuard>
                        <AdminLayout />
                    </AuthGuard>
                }
            >
                {/* 대시보드 — 항상 접근 가능 */}
                <Route index element={<Dashboard />} />

                {/* 콘텐츠 타입 */}
                <Route path="content-types" element={<P permission="content-type:read"><ContentTypeRouter /></P>}>
                    <Route index element={<ContentTypeList />} />
                    <Route path="new" element={<P permission="content-type:create"><ContentTypeForm /></P>} />
                    <Route path=":id/edit" element={<P permission="content-type:update"><ContentTypeForm /></P>} />
                </Route>

                {/* 콘텐츠 폼 카테고리 */}
                <Route path="form-categories" element={<P permission="content-type:read"><FormCategoryRouter /></P>}>
                    <Route index element={<FormCategoryList />} />
                    <Route path="new" element={<P permission="content-type:update"><FormCategoryForm /></P>} />
                    <Route path=":id/edit" element={<P permission="content-type:update"><FormCategoryForm /></P>} />
                </Route>

                {/* 콘텐츠 */}
                <Route path="contents/:contentTypeSlug" element={<P permission="content:read"><ContentRouter /></P>}>
                    <Route index element={<ContentList />} />
                    <Route path="new" element={<P permission="content:create"><ContentForm /></P>} />
                    <Route path=":id/edit" element={<P permission="content:update"><ContentForm /></P>} />
                    <Route path=":id/view" element={<P permission="content:read"><ContentForm readOnly /></P>} />
                </Route>

                {/* 파일 관리 */}
                <Route path="media" element={<P permission="media:read"><MediaRouter /></P>}>
                    <Route index element={<MediaList />} />
                </Route>

                {/* 역할/권한 */}
                <Route path="roles" element={<P permission="role:read"><RoleRouter /></P>}>
                    <Route index element={<RoleList />} />
                    <Route path="new" element={<P permission="role:create"><RoleForm /></P>} />
                    <Route path=":id/edit" element={<P permission="role:update"><RoleForm /></P>} />
                </Route>

                {/* 사용자 관리 */}
                <Route path="users" element={<P permission="user:read"><UserRouter /></P>}>
                    <Route index element={<UserList />} />
                    <Route path="new" element={<P permission="user:create"><UserForm /></P>} />
                    <Route path=":id/edit" element={<P permission="user:update"><UserForm /></P>} />
                </Route>

                {/* 시스템 설정 */}
                <Route path="settings" element={<P permission="settings:read"><SettingsPage /></P>} />

                {/* 감사 로그 */}
                <Route path="audit-logs" element={<P permission="audit-log:read"><AuditLogList /></P>} />

                {/* Webhook */}
                <Route path="webhooks" element={<P permission="webhook:read"><WebhookList /></P>} />

                {/* Import/Export — 콘텐츠 생성 권한 필요 */}
                <Route path="import-export" element={<P permission="content:create"><ImportExportPage /></P>} />

                {/* 백업/복원 — 슈퍼관리자 전용 */}
                <Route path="backups" element={<P permission="*"><BackupList /></P>} />

                {/* 검색 — 콘텐츠 조회 권한 필요 */}
                <Route path="search" element={<P permission="content:read"><SearchPage /></P>} />

                {/* API 가이드 — 슈퍼관리자 전용 */}
                <Route path="api-guide" element={<P permission="*"><ApiGuidePage /></P>} />

                {/* API 키 관리 — 슈퍼관리자 전용 */}
                <Route path="api-keys" element={<P permission="*"><ApiKeyList /></P>} />
            </Route>

            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
