import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/Components/features/AuthGuard.jsx';
import AdminLayout from '@/Components/layout/AdminLayout.jsx';

/* Pages */
import Login from '@pages/System/Login.jsx';
import Dashboard from '@pages/Dashboard/Dashboard.jsx';
import ContentTypeList from '@pages/ContentType/ContentTypeList.jsx';
import ContentList from '@pages/Content/ContentList.jsx';
import MediaList from '@pages/Media/MediaList.jsx';
import RoleList from '@pages/Role/RoleList.jsx';

/* Routers */
import ContentTypeRouter from '@pages/Router/ContentTypeRouter.jsx';
import ContentRouter from '@pages/Router/ContentRouter.jsx';
import MediaRouter from '@pages/Router/MediaRouter.jsx';
import RoleRouter from '@pages/Router/RoleRouter.jsx';

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
                </Route>

                <Route
                    path="contents/:contentTypeSlug"
                    element={<ContentRouter />}
                >
                    <Route index element={<ContentList />} />
                </Route>

                <Route path="media" element={<MediaRouter />}>
                    <Route index element={<MediaList />} />
                </Route>

                <Route path="roles" element={<RoleRouter />}>
                    <Route index element={<RoleList />} />
                </Route>
            </Route>

            {/* 기본 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
