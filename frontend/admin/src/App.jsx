import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/Components/features/AuthGuard.jsx';
import AdminLayout from '@/Components/layout/AdminLayout.jsx';

/* Pages */
import Login from '@pages/System/Login.jsx';
import Dashboard from '@pages/Dashboard/Dashboard.jsx';
import ContentTypeList from '@pages/ContentType/ContentTypeList.jsx';
import ContentTypeForm from '@pages/ContentType/ContentTypeForm.jsx';
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
import BackupList from '@pages/Backup/BackupList.jsx';

/* Routers */
import ContentTypeRouter from '@pages/Router/ContentTypeRouter.jsx';
import ContentRouter from '@pages/Router/ContentRouter.jsx';
import MediaRouter from '@pages/Router/MediaRouter.jsx';
import RoleRouter from '@pages/Router/RoleRouter.jsx';
import UserRouter from '@pages/Router/UserRouter.jsx';

/* CSS */
import '@/CSS/reset.css';
import '@/CSS/index.css';
import '@/CSS/component.css';

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
                <Route index element={<Dashboard />} />

                <Route path="content-types" element={<ContentTypeRouter />}>
                    <Route index element={<ContentTypeList />} />
                    <Route path="new" element={<ContentTypeForm />} />
                    <Route path=":id/edit" element={<ContentTypeForm />} />
                </Route>

                <Route
                    path="contents/:contentTypeSlug"
                    element={<ContentRouter />}
                >
                    <Route index element={<ContentList />} />
                    <Route path="new" element={<ContentForm />} />
                    <Route path=":id/edit" element={<ContentForm />} />
                </Route>

                <Route path="media" element={<MediaRouter />}>
                    <Route index element={<MediaList />} />
                </Route>

                <Route path="roles" element={<RoleRouter />}>
                    <Route index element={<RoleList />} />
                    <Route path="new" element={<RoleForm />} />
                    <Route path=":id/edit" element={<RoleForm />} />
                </Route>

                <Route path="users" element={<UserRouter />}>
                    <Route index element={<UserList />} />
                    <Route path="new" element={<UserForm />} />
                    <Route path=":id/edit" element={<UserForm />} />
                </Route>

                <Route path="settings" element={<SettingsPage />} />
                <Route path="audit-logs" element={<AuditLogList />} />
                <Route path="webhooks" element={<WebhookList />} />
                <Route path="import-export" element={<ImportExportPage />} />
                <Route path="backups" element={<BackupList />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="api-guide" element={<ApiGuidePage />} />
            </Route>

            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
