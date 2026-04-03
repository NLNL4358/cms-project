/**
 * @description
 * API 가이드 페이지
 * CMS의 모든 REST API 사용법을 카테고리별로 보여줍니다.
 * 콘텐츠 API는 콘텐츠 타입에 따라 동적으로 생성됩니다.
 */
import { useState } from 'react';
import { Code, ExternalLink, Copy, Check } from 'lucide-react';

import { useGlobal } from '@/Providers/GlobalContext.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import '@/CSS/local/api-guide.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** 전체 API 카테고리 정의 */
function buildApiSections(contentTypes, selectedType) {
    const sections = [];

    // ─── 인증 ───
    sections.push({
        id: 'auth',
        title: '인증',
        endpoints: [
            {
                id: 'auth-login',
                group: '로그인 / 회원가입',
                method: 'POST',
                path: '/auth/login',
                title: '로그인',
                desc: '이메일/비밀번호로 로그인하여 JWT 토큰을 발급받습니다. 로그인 API는 1분에 5회로 제한됩니다.',
                body: json({ email: 'admin@cms.com', password: 'password123' }),
                response: json({ accessToken: 'eyJ...', refreshToken: '...', user: { id: '...', email: '...', name: '...' } }),
            },
            {
                id: 'auth-register',
                method: 'POST',
                path: '/auth/register',
                title: '회원가입',
                desc: '새 계정을 생성합니다',
                body: json({ email: 'new@email.com', password: 'password123', name: '홍길동' }),
            },
            {
                id: 'auth-refresh',
                group: '토큰 관리',
                method: 'POST',
                path: '/auth/refresh',
                title: '토큰 갱신',
                desc: 'Refresh Token으로 새 Access Token을 발급받습니다. 사용된 Refresh Token은 즉시 무효화됩니다 (Rotation).',
                body: json({ refreshToken: 'your_refresh_token' }),
            },
            {
                id: 'auth-me',
                method: 'GET',
                path: '/auth/me',
                title: '내 정보 조회',
                desc: '현재 로그인한 사용자의 프로필을 반환합니다',
                auth: true,
            },
            {
                id: 'auth-logout',
                method: 'POST',
                path: '/auth/logout',
                title: '로그아웃',
                desc: 'Refresh Token을 무효화합니다',
                auth: true,
            },
        ],
    });

    // ─── 콘텐츠 타입 ───
    sections.push({
        id: 'content-types',
        title: '콘텐츠 타입',
        endpoints: [
            {
                id: 'ct-list', group: '조회', method: 'GET', path: '/content-types',
                title: '목록 조회', desc: '모든 콘텐츠 타입을 조회합니다', auth: true,
            },
            {
                id: 'ct-detail', group: '조회', method: 'GET', path: '/content-types/:id',
                title: '상세 조회', desc: 'ID 또는 slug로 조회합니다', auth: true,
            },
            {
                id: 'ct-create', group: '생성', method: 'POST', path: '/content-types',
                title: '생성', desc: '새 콘텐츠 타입을 생성합니다', auth: true,
                body: json({
                    name: '게시판', slug: 'board',
                    description: '일반 게시판',
                    fields: [
                        { name: 'title', label: '제목', type: 'text', required: true },
                        { name: 'content', label: '내용', type: 'richtext', required: true },
                    ],
                }),
            },
            {
                id: 'ct-update', group: '수정', method: 'PATCH', path: '/content-types/:id',
                title: '수정', desc: '콘텐츠 타입을 수정합니다', auth: true,
                body: json({ name: '수정된 이름', description: '수정된 설명' }),
            },
            {
                id: 'ct-delete', group: '삭제', method: 'DELETE', path: '/content-types/:id',
                title: '삭제', desc: '콘텐츠 타입을 삭제합니다 (하위 콘텐츠도 삭제)', auth: true,
            },
        ],
    });

    // ─── 콘텐츠 (동적) ───
    const contentEndpoints = [];
    if (selectedType) {
        const fields = Array.isArray(selectedType.fields) ? selectedType.fields : [];
        const dataExample = {};
        fields.forEach((f) => {
            switch (f.type) {
                case 'text': case 'slug': dataExample[f.name] = `${f.label || f.name} 값`; break;
                case 'richtext': case 'textarea': dataExample[f.name] = '<p>내용</p>'; break;
                case 'number': dataExample[f.name] = 0; break;
                case 'boolean': case 'toggle': dataExample[f.name] = true; break;
                default: dataExample[f.name] = '';
            }
        });

        contentEndpoints.push(
            {
                id: 'c-list', group: '조회', method: 'GET',
                path: `/contents?contentTypeId=${selectedType.id}`,
                title: `${selectedType.name} 목록 조회`, auth: true,
                desc: '페이지네이션, 검색, 상태 필터 지원',
                params: [
                    { name: 'page', type: 'number', desc: '페이지 번호 (기본: 1)' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수 (기본: 10)' },
                    { name: 'search', type: 'string', desc: '제목/슬러그 검색' },
                    { name: 'status', type: 'string', desc: 'DRAFT | PUBLISHED | ARCHIVED' },
                ],
            },
            {
                id: 'c-detail', group: '조회', method: 'GET', path: '/contents/:id',
                title: `${selectedType.name} 상세 조회`, auth: true, desc: 'ID로 단건 조회',
            },
            {
                id: 'c-create', group: '생성', method: 'POST', path: '/contents',
                title: `${selectedType.name} 생성`, auth: true, desc: '새 콘텐츠를 생성합니다',
                body: json({ contentTypeId: selectedType.id, title: '제목', slug: 'example-slug', data: dataExample }),
            },
            {
                id: 'c-update', group: '수정', method: 'PATCH', path: '/contents/:id',
                title: `${selectedType.name} 수정`, auth: true, desc: '콘텐츠를 수정합니다',
                body: json({ title: '수정된 제목', data: dataExample }),
            },
            {
                id: 'c-delete', group: '삭제', method: 'DELETE', path: '/contents/:id',
                title: `${selectedType.name} 삭제`, auth: true, desc: '소프트 삭제',
            },
            {
                id: 'c-publish', group: '상태 변경', method: 'POST', path: '/contents/:id/publish',
                title: '발행', auth: true, desc: '콘텐츠를 발행합니다',
            },
            {
                id: 'c-unpublish', method: 'POST', path: '/contents/:id/unpublish',
                title: '미발행', auth: true, desc: '발행을 취소합니다',
            },
            {
                id: 'c-archive', method: 'POST', path: '/contents/:id/archive',
                title: '보관', auth: true, desc: '콘텐츠를 보관합니다',
            },
            {
                id: 'c-unarchive', method: 'POST', path: '/contents/:id/unarchive',
                title: '보관 해제', auth: true, desc: '보관된 콘텐츠를 초안으로 복원합니다',
            },
            {
                id: 'c-versions', group: '버전 관리', method: 'GET', path: '/contents/:id/versions',
                title: '버전 히스토리', auth: true, desc: '콘텐츠의 모든 버전을 조회합니다',
            },
            {
                id: 'c-restore', method: 'POST', path: '/contents/:id/versions/:version/restore',
                title: '버전 복원', auth: true, desc: '특정 버전으로 콘텐츠를 되돌립니다',
            },
            {
                id: 'c-by-slug', method: 'GET', path: `/contents/${selectedType?.id}/slug/:slug`,
                title: 'slug로 조회', auth: true, desc: '콘텐츠 타입 ID + slug로 단건 조회합니다',
            },
        );
    }
    sections.push({
        id: 'contents',
        title: '콘텐츠',
        dynamic: true,
        endpoints: contentEndpoints,
    });

    // ─── 미디어 ───
    sections.push({
        id: 'media',
        title: '파일 관리',
        endpoints: [
            {
                id: 'm-list', group: '조회', method: 'GET', path: '/media',
                title: '파일 목록', auth: true, desc: '업로드된 파일 목록을 조회합니다',
                params: [
                    { name: 'page', type: 'number', desc: '페이지 번호' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수' },
                    { name: 'type', type: 'string', desc: 'image | video | audio | document | other' },
                    { name: 'search', type: 'string', desc: '파일명 검색' },
                ],
            },
            {
                id: 'm-upload', group: '업로드', method: 'POST', path: '/media/upload',
                title: '파일 업로드', auth: true, desc: 'multipart/form-data로 파일을 업로드합니다',
                body: 'Content-Type: multipart/form-data\nfield: file (파일)\nfield: alt (대체 텍스트, 선택)',
            },
            {
                id: 'm-detail', group: '조회', method: 'GET', path: '/media/:id',
                title: '파일 상세', auth: true, desc: '파일 메타데이터를 조회합니다',
            },
            {
                id: 'm-update', group: '수정', method: 'PATCH', path: '/media/:id',
                title: '파일 정보 수정', auth: true, desc: '파일명, 대체 텍스트 등을 수정합니다',
                body: json({ alt: '새 대체 텍스트' }),
            },
            {
                id: 'm-delete', group: '삭제', method: 'DELETE', path: '/media/:id',
                title: '파일 삭제', auth: true, desc: '파일을 소프트 삭제합니다 (메타데이터 삭제, 디스크 파일 유지)',
            },
            {
                id: 'm-hard-delete', method: 'DELETE', path: '/media/:id/hard',
                title: '파일 영구 삭제', auth: true, desc: '파일을 디스크에서 완전히 삭제합니다 (복구 불가)',
            },
            {
                id: 'm-upload-multi', method: 'POST', path: '/media/upload/multiple',
                title: '다중 파일 업로드', auth: true, desc: 'multipart/form-data로 최대 10개 파일을 한 번에 업로드합니다',
                body: 'Content-Type: multipart/form-data\nfield: files (파일 배열, 최대 10개)\nfield: folderId (폴더 ID, 선택)',
            },
        ],
    });

    // ─── 미디어 폴더 ───
    sections.push({
        id: 'media-folders',
        title: '미디어 폴더',
        endpoints: [
            { id: 'mf-list', group: '조회', method: 'GET', path: '/media/folders', title: '폴더 목록', auth: true, desc: '계층형 폴더 목록을 조회합니다' },
            { id: 'mf-detail', group: '조회', method: 'GET', path: '/media/folders/:id', title: '폴더 상세', auth: true, desc: '특정 폴더 정보를 조회합니다' },
            {
                id: 'mf-create', group: '생성', method: 'POST', path: '/media/folders', title: '폴더 생성', auth: true, desc: '새 폴더를 생성합니다',
                body: json({ name: '이미지 폴더', parentId: null }),
            },
            {
                id: 'mf-update', group: '수정', method: 'PATCH', path: '/media/folders/:id', title: '폴더 수정', auth: true, desc: '폴더명이나 상위 폴더를 변경합니다',
                body: json({ name: '수정된 폴더명' }),
            },
            { id: 'mf-delete', group: '삭제', method: 'DELETE', path: '/media/folders/:id', title: '폴더 삭제', auth: true, desc: '빈 폴더를 삭제합니다' },
        ],
    });

    // ─── 역할/권한 ───
    sections.push({
        id: 'roles',
        title: '역할/권한',
        endpoints: [
            { id: 'r-list', group: '조회', method: 'GET', path: '/roles', title: '역할 목록', auth: true, desc: '모든 역할을 조회합니다' },
            { id: 'r-detail', group: '조회', method: 'GET', path: '/roles/:id', title: '역할 상세', auth: true, desc: 'ID 또는 slug로 조회' },
            {
                id: 'r-create', group: '생성', method: 'POST', path: '/roles', title: '역할 생성', auth: true, desc: '새 역할을 생성합니다',
                body: json({ name: '편집자', slug: 'editor', description: '콘텐츠 편집 권한', permissions: ['content:read', 'content:create', 'content:update'] }),
            },
            { id: 'r-update', group: '수정', method: 'PATCH', path: '/roles/:id', title: '역할 수정', auth: true, desc: '역할 정보를 수정합니다', body: json({ name: '수정된 역할명' }) },
            { id: 'r-delete', group: '삭제', method: 'DELETE', path: '/roles/:id', title: '역할 삭제', auth: true, desc: '역할을 삭제합니다' },
        ],
    });

    // ─── 사용자 역할 관리 ───
    sections.push({
        id: 'user-roles',
        title: '사용자 역할',
        endpoints: [
            { id: 'ur-request', group: '요청', method: 'POST', path: '/user-roles/request', title: '역할 요청', auth: true, desc: '사용자가 역할을 요청합니다',
                body: json({ roleId: 'role-id' }),
            },
            { id: 'ur-pending', group: '조회', method: 'GET', path: '/user-roles/requests/pending', title: '대기 요청 목록', auth: true, desc: '승인 대기 중인 역할 요청 목록 (관리자용)' },
            { id: 'ur-my-requests', group: '조회', method: 'GET', path: '/user-roles/my-requests', title: '내 요청 목록', auth: true, desc: '현재 사용자의 역할 요청 이력' },
            { id: 'ur-my-roles', group: '조회', method: 'GET', path: '/user-roles/my-roles', title: '내 역할 목록', auth: true, desc: '현재 사용자에게 할당된 역할 목록' },
            { id: 'ur-approve', group: '승인/거절', method: 'POST', path: '/user-roles/requests/:id/approve', title: '요청 승인', auth: true, desc: '역할 요청을 승인합니다 (관리자용)' },
            { id: 'ur-reject', group: '승인/거절', method: 'POST', path: '/user-roles/requests/:id/reject', title: '요청 거절', auth: true, desc: '역할 요청을 거절합니다 (관리자용)',
                body: json({ reason: '거절 사유' }),
            },
            { id: 'ur-user-roles', group: '관리', method: 'GET', path: '/user-roles/users/:userId/roles', title: '특정 사용자 역할', auth: true, desc: '특정 사용자의 역할 목록을 조회합니다' },
            { id: 'ur-remove', group: '관리', method: 'DELETE', path: '/user-roles/users/:userId/roles/:roleId', title: '역할 제거', auth: true, desc: '사용자에서 역할을 제거합니다' },
        ],
    });

    // ─── 사용자 ───
    sections.push({
        id: 'users',
        title: '사용자 관리',
        endpoints: [
            { id: 'u-list', group: '조회', method: 'GET', path: '/users', title: '사용자 목록', auth: true, desc: '모든 사용자를 조회합니다' },
            { id: 'u-detail', group: '조회', method: 'GET', path: '/users/:id', title: '사용자 상세', auth: true, desc: '사용자 정보를 조회합니다' },
            {
                id: 'u-create', group: '생성', method: 'POST', path: '/users', title: '사용자 생성', auth: true, desc: '새 사용자를 생성합니다',
                body: json({ email: 'editor@cms.com', password: 'password123', name: '편집자', type: 'ADMIN', roleIds: ['role-id'] }),
            },
            { id: 'u-update', group: '수정', method: 'PATCH', path: '/users/:id', title: '사용자 수정', auth: true, desc: '사용자 정보를 수정합니다' },
            { id: 'u-delete', group: '삭제', method: 'DELETE', path: '/users/:id', title: '사용자 삭제', auth: true, desc: '사용자를 삭제합니다' },
        ],
    });

    // ─── 검색 ───
    sections.push({
        id: 'search',
        title: '검색',
        endpoints: [
            {
                id: 's-search', method: 'GET', path: '/search',
                title: '통합 검색', auth: true, desc: 'MeiliSearch 기반 콘텐츠 통합 검색',
                params: [
                    { name: 'q', type: 'string', desc: '검색어 (필수)' },
                    { name: 'contentTypeSlug', type: 'string', desc: '콘텐츠 타입 필터' },
                    { name: 'status', type: 'string', desc: '상태 필터' },
                    { name: 'page', type: 'number', desc: '페이지 번호' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수' },
                ],
            },
            { id: 's-reindex', method: 'POST', path: '/search/reindex', title: '재인덱싱', auth: true, desc: '검색 인덱스를 전체 재구축합니다' },
        ],
    });

    // ─── 감사 로그 ───
    sections.push({
        id: 'audit-logs',
        title: '감사 로그',
        endpoints: [
            {
                id: 'al-list', method: 'GET', path: '/audit-logs',
                title: '로그 목록', auth: true, desc: '시스템 활동 로그를 조회합니다',
                params: [
                    { name: 'page', type: 'number', desc: '페이지 번호' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수' },
                    { name: 'userId', type: 'string', desc: '사용자 ID 필터' },
                    { name: 'action', type: 'string', desc: 'CREATE | UPDATE | DELETE | PUBLISH | ARCHIVE 등' },
                    { name: 'entity', type: 'string', desc: '대상 엔티티 (content, media, user 등)' },
                    { name: 'search', type: 'string', desc: '엔티티/액션 검색' },
                    { name: 'startDate', type: 'string', desc: '시작일 (YYYY-MM-DD)' },
                    { name: 'endDate', type: 'string', desc: '종료일 (YYYY-MM-DD)' },
                ],
            },
            { id: 'al-detail', method: 'GET', path: '/audit-logs/:id', title: '로그 상세', auth: true, desc: '특정 로그의 상세 정보를 조회합니다' },
            { id: 'al-actions', method: 'GET', path: '/audit-logs/actions', title: '액션 목록', auth: true, desc: '필터용 액션 종류 목록' },
            { id: 'al-entities', method: 'GET', path: '/audit-logs/entities', title: '엔티티 목록', auth: true, desc: '필터용 엔티티 종류 목록' },
        ],
    });

    // ─── Webhook ───
    sections.push({
        id: 'webhooks',
        title: 'Webhook',
        endpoints: [
            { id: 'wh-list', group: '조회', method: 'GET', path: '/webhooks', title: '목록 조회', auth: true, desc: '등록된 Webhook 목록' },
            { id: 'wh-detail', group: '조회', method: 'GET', path: '/webhooks/:id', title: '상세 조회', auth: true, desc: '특정 Webhook 설정을 조회합니다' },
            {
                id: 'wh-create', group: '생성', method: 'POST', path: '/webhooks', title: '생성', auth: true, desc: 'Webhook을 등록합니다',
                body: json({ name: 'Slack 알림', url: 'https://hooks.slack.com/...', events: ['content:create', 'content:update'], secret: 'optional-secret', isActive: true }),
            },
            { id: 'wh-update', group: '수정', method: 'PATCH', path: '/webhooks/:id', title: '수정', auth: true, desc: 'Webhook 설정을 수정합니다' },
            { id: 'wh-delete', group: '삭제', method: 'DELETE', path: '/webhooks/:id', title: '삭제', auth: true, desc: 'Webhook을 삭제합니다' },
            { id: 'wh-test', group: '테스트', method: 'POST', path: '/webhooks/:id/test', title: '테스트 발송', auth: true, desc: '테스트 요청을 발송합니다' },
        ],
    });

    // ─── Import/Export ───
    sections.push({
        id: 'import-export',
        title: 'Import/Export',
        endpoints: [
            {
                id: 'ie-json', method: 'GET', path: '/import-export/export/json',
                title: 'JSON 내보내기', auth: true, desc: '콘텐츠를 JSON으로 내보냅니다',
                params: [{ name: 'contentTypeId', type: 'string', desc: '콘텐츠 타입 ID (필수)' }, { name: 'status', type: 'string', desc: '상태 필터' }],
            },
            {
                id: 'ie-csv', method: 'GET', path: '/import-export/export/csv',
                title: 'CSV 내보내기', auth: true, desc: '콘텐츠를 CSV로 내보냅니다 (엑셀 호환)',
                params: [{ name: 'contentTypeId', type: 'string', desc: '콘텐츠 타입 ID (필수)' }],
            },
            {
                id: 'ie-preview', method: 'POST', path: '/import-export/import/preview',
                title: '가져오기 미리보기', auth: true, desc: '유효성 검사 결과를 확인합니다',
                body: json({ contentTypeId: 'content-type-id', items: [{ title: '제목', slug: 'slug', data: {} }] }),
            },
            {
                id: 'ie-execute', method: 'POST', path: '/import-export/import/execute',
                title: '가져오기 실행', auth: true, desc: '콘텐츠를 대량 생성합니다. overwrite: true면 동일 slug 덮어쓰기',
                body: json({ contentTypeId: 'content-type-id', items: [{ title: '제목', slug: 'slug', data: {} }], overwrite: false }),
            },
            {
                id: 'ie-parse', method: 'POST', path: '/import-export/parse/csv',
                title: 'CSV 파싱', auth: true, desc: 'CSV 텍스트를 파싱하여 JSON 배열로 반환합니다',
                body: json({ csvText: 'title,slug\\n제목,my-slug' }),
            },
        ],
    });

    // ─── 설정 ───
    sections.push({
        id: 'settings',
        title: '시스템 설정',
        endpoints: [
            { id: 'set-get', method: 'GET', path: '/settings', title: '설정 조회', auth: true, desc: '모든 시스템 설정을 조회합니다' },
            {
                id: 'set-update', method: 'PATCH', path: '/settings', title: '설정 수정', auth: true, desc: '설정을 일괄 수정합니다',
                body: json({ settings: { siteName: '내 사이트', adminEmail: 'admin@site.com', timezone: 'Asia/Seoul' } }),
            },
        ],
    });

    // ─── 백업 ───
    sections.push({
        id: 'backups',
        title: '백업/복원',
        endpoints: [
            { id: 'bk-list', group: '조회', method: 'GET', path: '/backups', title: '백업 목록', auth: true, desc: '생성된 백업 목록을 조회합니다' },
            { id: 'bk-create', group: '생성', method: 'POST', path: '/backups', title: '백업 생성', auth: true, desc: 'DB + 업로드 파일을 ZIP으로 백업합니다', body: json({ description: '수동 백업' }) },
            { id: 'bk-download', group: '다운로드', method: 'GET', path: '/backups/:filename/download', title: '백업 다운로드', auth: true, desc: '백업 파일을 다운로드합니다' },
            { id: 'bk-restore', group: '복원', method: 'POST', path: '/backups/:filename/restore', title: '백업 복원', auth: true, desc: '해당 시점으로 복원합니다' },
            { id: 'bk-upload', group: '복원', method: 'POST', path: '/backups/upload-restore', title: '파일 업로드 복원', auth: true, desc: '.zip 또는 .sql 파일을 업로드하여 복원합니다' },
            { id: 'bk-delete', group: '삭제', method: 'DELETE', path: '/backups/:filename', title: '백업 삭제', auth: true, desc: '백업 파일을 삭제합니다' },
        ],
    });

    // ─── 알림 ───
    sections.push({
        id: 'notifications',
        title: '알림',
        endpoints: [
            { id: 'n-list', group: '조회', method: 'GET', path: '/notifications', title: '알림 목록', auth: true, desc: '내 알림을 조회합니다', params: [{ name: 'page', type: 'number', desc: '페이지' }, { name: 'limit', type: 'number', desc: '개수' }] },
            { id: 'n-unread', group: '조회', method: 'GET', path: '/notifications/unread-count', title: '안 읽은 수', auth: true, desc: '안 읽은 알림 개수를 반환합니다' },
            { id: 'n-read', group: '읽음 처리', method: 'POST', path: '/notifications/:id/read', title: '읽음 처리', auth: true, desc: '단건 읽음 처리' },
            { id: 'n-readall', group: '읽음 처리', method: 'POST', path: '/notifications/read-all', title: '전체 읽음', auth: true, desc: '모든 알림을 읽음 처리합니다' },
            { id: 'n-delete', group: '삭제', method: 'DELETE', path: '/notifications/:id', title: '알림 삭제', auth: true, desc: '알림을 삭제합니다' },
        ],
    });

    // ─── 대시보드 ───
    sections.push({
        id: 'dashboard',
        title: '대시보드',
        endpoints: [
            {
                id: 'dash-stats', method: 'GET', path: '/dashboard/stats',
                title: '통계 조회', auth: true, desc: '콘텐츠/콘텐츠 타입/파일/사용자 수, 최근 활동, 저장소 사용량 등 대시보드 통계를 반환합니다',
            },
        ],
    });

    return sections;
}

function json(obj) {
    return JSON.stringify(obj, null, 2);
}

function ApiGuidePage() {
    const { contentTypes } = useGlobal();
    const [activeSection, setActiveSection] = useState('auth');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const selectedType = contentTypes.find((ct) => ct.slug === selectedSlug);
    const sections = buildApiSections(contentTypes, selectedType);
    const currentSection = sections.find((s) => s.id === activeSection);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const CopyBtn = ({ text, id }) => (
        <button className="apiCopyBtn" onClick={() => copyToClipboard(text, id)} title="복사">
            {copiedId === id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
    );

    const METHOD_COLOR = {
        GET: 'apiMethodGet', POST: 'apiMethodPost',
        PATCH: 'apiMethodPatch', DELETE: 'apiMethodDelete',
    };

    const buildCurl = (ep) => {
        let curl = `curl -X ${ep.method} "${API_BASE}${ep.path}"`;
        if (ep.auth) curl += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN"`;
        if (ep.body && ep.body.startsWith('{')) {
            curl += ` \\\n  -H "Content-Type: application/json"`;
            curl += ` \\\n  -d '${ep.body.replace(/\n/g, '')}'`;
        }
        return curl;
    };

    return (
        <div className="apiGuideWrap">
            {/* 헤더 */}
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <Code className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">API 가이드</h2>
                    <a href={`${API_BASE}/api-docs`} target="_blank" rel="noopener noreferrer" className="apiSwaggerLink">
                        <ExternalLink className="size-4" /> Swagger 문서
                    </a>
                </div>
                <p className="pageDescription">
                    이 CMS의 모든 REST API 사용법을 확인합니다. 모든 요청에는 JWT 인증이 필요합니다.
                </p>
            </div>

            <div className="apiGuideLayout">
                {/* 왼쪽 네비게이션 */}
                <nav className="apiNav">
                    {sections.map((s) => (
                        <button
                            key={s.id}
                            className={`apiNavItem ${activeSection === s.id ? 'apiNavItemActive' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            {s.title}
                            <span className="apiNavCount">{s.endpoints.length}</span>
                        </button>
                    ))}
                </nav>

                {/* 오른쪽 콘텐츠 */}
                <div className="apiContent">
                    <h3 className="apiSectionTitle">{currentSection?.title}</h3>

                    {/* 콘텐츠 섹션일 때 타입 선택 */}
                    {currentSection?.dynamic && (
                        <div className="apiTypeSelect">
                            <Select
                                value={selectedSlug || 'none'}
                                onValueChange={(v) => setSelectedSlug(v === 'none' ? '' : v)}
                            >
                                <SelectTrigger className="apiTypeSelectTrigger">
                                    <SelectValue placeholder="콘텐츠 타입을 선택하세요" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">콘텐츠 타입을 선택하세요</SelectItem>
                                    {contentTypes.map((ct) => (
                                        <SelectItem key={ct.slug} value={ct.slug}>{ct.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!selectedType && (
                                <p className="apiTypeHint">콘텐츠 타입을 선택하면 해당 타입의 API 사용법이 표시됩니다</p>
                            )}
                        </div>
                    )}

                    {/* 엔드포인트 목록 (그룹별) */}
                    {(() => {
                        const eps = currentSection?.endpoints || [];
                        let lastGroup = null;
                        return eps.map((ep) => {
                            const showGroup = ep.group && ep.group !== lastGroup;
                            lastGroup = ep.group;
                            return (
                                <div key={ep.id}>
                                    {showGroup && (
                                        <h4 className="apiGroupTitle">{ep.group}</h4>
                                    )}
                                    <div className="apiEndpoint">
                            <div className="apiEndpointHeader">
                                <span className={`apiMethod ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                                <code className="apiPath">{ep.path}</code>
                                <span className="apiEndpointTitle">{ep.title}</span>
                            </div>
                            <p className="apiEndpointDesc">{ep.desc}</p>

                            {ep.params && (
                                <div className="apiParams">
                                    <span className="apiParamsLabel">쿼리 파라미터</span>
                                    <table className="apiParamsTable">
                                        <tbody>
                                            {ep.params.map((p) => (
                                                <tr key={p.name}>
                                                    <td><code>{p.name}</code></td>
                                                    <td className="apiParamType">{p.type}</td>
                                                    <td>{p.desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {ep.body && (
                                <div className="apiCodeBlock">
                                    <div className="apiCodeHeader">
                                        <span>요청 본문</span>
                                        <CopyBtn text={ep.body} id={`body-${ep.id}`} />
                                    </div>
                                    <pre className="apiCodePre">{ep.body}</pre>
                                </div>
                            )}

                            {ep.response && (
                                <div className="apiCodeBlock">
                                    <div className="apiCodeHeader">
                                        <span>응답 예시</span>
                                        <CopyBtn text={ep.response} id={`res-${ep.id}`} />
                                    </div>
                                    <pre className="apiCodePre">{ep.response}</pre>
                                </div>
                            )}

                            <div className="apiCodeBlock">
                                <div className="apiCodeHeader">
                                    <span>cURL</span>
                                    <CopyBtn text={buildCurl(ep)} id={`curl-${ep.id}`} />
                                </div>
                                <pre className="apiCodePre">{buildCurl(ep)}</pre>
                            </div>
                        </div>
                                </div>
                            );
                        });
                    })()}

                    {currentSection?.endpoints.length === 0 && (
                        <div className="apiEmpty">
                            {currentSection.dynamic
                                ? '위에서 콘텐츠 타입을 선택하세요'
                                : '엔드포인트가 없습니다'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ApiGuidePage;
