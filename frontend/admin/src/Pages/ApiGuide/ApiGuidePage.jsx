/**
 * @description
 * API 가이드 페이지
 * CMS의 모든 REST API 사용법을 카테고리별로 보여줍니다.
 * 콘텐츠 API는 콘텐츠 타입에 따라 동적으로 생성됩니다.
 */
import { useState } from 'react';
import { Code, ExternalLink, Copy, Check, HelpCircle } from 'lucide-react';

import { useGlobal } from '@/Providers/GlobalContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
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

    // ─── Public API (외부 통합용) ───
    sections.push({
        id: 'public-api',
        category: 'public',
        title: 'Public API',
        endpoints: [
            {
                id: 'pub-types', group: '콘텐츠 타입', method: 'GET', path: '/public/content-types',
                title: '콘텐츠 타입 목록', desc: '발행된 콘텐츠 타입 목록 (외부 앱용)',
                authNote: 'API 키 필요: Authorization: Bearer sk_live_xxxxx',
            },
            {
                id: 'pub-type-detail', group: '콘텐츠 타입', method: 'GET', path: '/public/content-types/:slug',
                title: '콘텐츠 타입 상세', desc: 'slug로 콘텐츠 타입 조회',
                authNote: 'API 키 필요',
            },
            {
                id: 'pub-list', group: '콘텐츠', method: 'GET', path: '/public/contents/:contentTypeSlug',
                title: '발행된 콘텐츠 목록', desc: '발행된 콘텐츠만 반환합니다. 동적 필드 필터링 지원',
                authNote: 'API 키 필요',
                params: [
                    { name: 'page', type: 'number', desc: '페이지 번호 (1 이상, 기본: 1)' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수 (1~100, 기본: 10)' },
                    { name: 'sort', type: 'string', desc: 'createdAt | updatedAt | publishedAt' },
                    { name: 'order', type: 'string', desc: 'asc | desc (기본: desc)' },
                    { name: 'search', type: 'string', desc: '제목/슬러그 검색' },
                    { name: 'filter[필드명]', type: 'any', desc: '동적 필드 필터링. 콘텐츠 타입에 정의된 필드만 허용 (정의되지 않은 필드는 무시됨). 예: filter[category]=tech' },
                ],
            },
            {
                id: 'pub-detail', group: '콘텐츠', method: 'GET', path: '/public/contents/:contentTypeSlug/:slug',
                title: '발행된 콘텐츠 상세', desc: 'slug로 단건 조회 (발행된 것만)',
                authNote: 'API 키 필요',
            },
        ],
    });

    // ─── Member 인증 (외부 회원용) ───
    sections.push({
        id: 'member-auth',
        category: 'public',
        title: '회원 인증',
        endpoints: [
            {
                id: 'mauth-register', group: '회원가입/로그인', method: 'POST', path: '/public/auth/register',
                title: '회원가입', desc: '외부 사이트 일반 회원가입 (MEMBER 타입). 분당 5회 제한',
                body: json({ email: 'user@example.com', password: 'password123', name: '홍길동' }),
            },
            {
                id: 'mauth-login', group: '회원가입/로그인', method: 'POST', path: '/public/auth/login',
                title: '로그인', desc: '회원 로그인. JWT 토큰 발급',
                body: json({ email: 'user@example.com', password: 'password123' }),
            },
            {
                id: 'mauth-refresh', group: '토큰 관리', method: 'POST', path: '/public/auth/refresh',
                title: '토큰 갱신', desc: 'Refresh Token으로 새 Access Token 발급',
                body: json({ refreshToken: 'your_refresh_token' }),
            },
            {
                id: 'mauth-logout', group: '토큰 관리', method: 'POST', path: '/public/auth/logout',
                title: '로그아웃', desc: '로그아웃 (Refresh Token 무효화)', auth: true,
            },
            {
                id: 'mauth-me', group: '프로필', method: 'GET', path: '/public/auth/me',
                title: '내 정보 조회', desc: '현재 로그인한 회원의 프로필', auth: true,
            },
            {
                id: 'mauth-update', group: '프로필', method: 'PATCH', path: '/public/auth/me',
                title: '내 정보 수정', desc: '이름이나 비밀번호 수정', auth: true,
                body: json({ name: '새 이름', currentPassword: '현재 비밀번호', password: '새 비밀번호' }),
            },
            {
                id: 'mauth-forgot', group: '비밀번호 재설정', method: 'POST', path: '/public/auth/forgot-password',
                title: '비밀번호 재설정 요청', desc: '재설정 링크가 담긴 이메일을 발송합니다 (분당 3회 제한)',
                body: json({ email: 'user@example.com' }),
            },
            {
                id: 'mauth-reset', group: '비밀번호 재설정', method: 'POST', path: '/public/auth/reset-password',
                title: '비밀번호 재설정 실행', desc: '이메일에 받은 토큰으로 새 비밀번호 설정',
                body: json({ token: 'reset-token-from-email', password: 'new-password' }),
            },
            {
                id: 'mauth-verify', group: '이메일 인증', method: 'POST', path: '/public/auth/verify-email',
                title: '이메일 인증', desc: '가입 시 받은 이메일의 토큰으로 인증',
                body: json({ token: 'verification-token' }),
            },
            {
                id: 'mauth-resend', group: '이메일 인증', method: 'POST', path: '/public/auth/resend-verification',
                title: '인증 메일 재발송', desc: '인증 메일을 다시 보냅니다 (분당 2회 제한)', auth: true,
            },
        ],
    });

    // ─── Member 콘텐츠 (외부 회원이 글 작성) ───
    sections.push({
        id: 'member-contents',
        category: 'public',
        title: '회원 콘텐츠',
        endpoints: [
            {
                id: 'mc-mine', group: '조회', method: 'GET', path: '/public/member/contents/my',
                title: '내가 작성한 글 목록', desc: '본인이 작성한 콘텐츠 목록 (모든 상태 포함)', auth: true,
                params: [
                    { name: 'contentTypeSlug', type: 'string', desc: '콘텐츠 타입 슬러그 (선택)' },
                    { name: 'page', type: 'number', desc: '페이지 번호' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수' },
                ],
            },
            {
                id: 'mc-create', group: '작성', method: 'POST', path: '/public/member/contents/:contentTypeSlug',
                title: '글 작성', desc: '회원이 글을 작성합니다. 콘텐츠 타입의 "회원 작성 가능" 옵션이 켜져있어야 합니다',
                auth: true,
                body: json({ title: '내 글 제목', slug: 'my-post', data: { content: '<p>본문</p>' } }),
            },
            {
                id: 'mc-update', group: '수정', method: 'PATCH', path: '/public/member/contents/:id',
                title: '본인 글 수정', desc: '본인이 작성한 글만 수정 가능', auth: true,
                body: json({ title: '수정된 제목', data: { content: '<p>수정 본문</p>' } }),
            },
            {
                id: 'mc-delete', group: '삭제', method: 'DELETE', path: '/public/member/contents/:id',
                title: '본인 글 삭제', desc: '본인이 작성한 글만 삭제 가능 (소프트 삭제)', auth: true,
            },
        ],
    });

    // ─── Member 파일 업로드 ───
    sections.push({
        id: 'member-media',
        category: 'public',
        title: '회원 파일 업로드',
        endpoints: [
            {
                id: 'mm-upload', group: '업로드', method: 'POST', path: '/public/member/media/upload',
                title: '파일 업로드', desc: '회원이 파일을 업로드합니다 (프로필 사진, 게시글 첨부 등). multipart/form-data 사용',
                auth: true,
                body: 'Content-Type: multipart/form-data\nfield: file (파일, 최대 50MB)',
            },
        ],
    });

    // ─── API 키 관리 ───
    sections.push({
        id: 'api-keys',
        category: 'admin',
        title: 'API 키 관리',
        endpoints: [
            { id: 'ak-list', group: '조회', method: 'GET', path: '/api-keys', title: '키 목록', auth: true, desc: '발급된 API 키 목록' },
            {
                id: 'ak-create', group: '생성', method: 'POST', path: '/api-keys', title: '키 발급', auth: true,
                desc: '새 API 키를 발급합니다 (평문은 한 번만 표시)',
                body: json({ name: '메인 사이트', permissions: ['public:read'], expiresAt: null }),
            },
            { id: 'ak-toggle', group: '관리', method: 'PATCH', path: '/api-keys/:id/toggle', title: '활성/비활성', auth: true, desc: '키를 활성화/비활성화합니다', body: json({ isActive: true }) },
            { id: 'ak-delete', group: '관리', method: 'DELETE', path: '/api-keys/:id', title: '키 삭제', auth: true, desc: '키를 영구 삭제합니다 (외부 앱 즉시 차단)' },
        ],
    });

    // ─── 인증 ───
    sections.push({
        id: 'auth',
        category: 'admin',
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
        category: 'admin',
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
                desc: '페이지네이션, 검색, 상태 필터, 동적 필드 필터 지원',
                params: [
                    { name: 'page', type: 'number', desc: '페이지 번호 (1 이상, 기본: 1)' },
                    { name: 'limit', type: 'number', desc: '페이지당 개수 (1~100, 기본: 20)' },
                    { name: 'search', type: 'string', desc: '제목/슬러그 검색' },
                    { name: 'status', type: 'string', desc: 'DRAFT | PUBLISHED | ARCHIVED' },
                    { name: 'filter[필드명]', type: 'any', desc: '동적 필드 필터 (예: filter[category]=tech)' },
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
        category: 'admin',
        title: '콘텐츠',
        dynamic: true,
        endpoints: contentEndpoints,
    });

    // ─── 미디어 ───
    sections.push({
        id: 'media',
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
        title: '시스템 설정',
        endpoints: [
            { id: 'set-get', group: '조회', method: 'GET', path: '/settings', title: '설정 조회', auth: true, desc: '모든 시스템 설정을 조회합니다 (SMTP 비밀번호는 마스킹)' },
            {
                id: 'set-update', group: '수정', method: 'PATCH', path: '/settings', title: '설정 수정', auth: true, desc: '설정을 일괄 수정합니다 (smtpPassword 빈값이면 기존 유지)',
                body: json({ settings: { siteName: '내 사이트', adminEmail: 'admin@site.com', timezone: 'Asia/Seoul' } }),
            },
            {
                id: 'set-test-email', group: '이메일', method: 'POST', path: '/email/test', title: '이메일 테스트 발송', auth: true, desc: 'SMTP 설정 검증용 테스트 메일 발송',
                body: json({ to: 'admin@example.com' }),
            },
        ],
    });

    // ─── 백업 ───
    sections.push({
        id: 'backups',
        category: 'admin',
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
        category: 'admin',
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
        category: 'admin',
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

/** URL 경로에서 :param 추출 (예: '/contents/:id/versions/:version' → ['id', 'version']) */
function extractUrlParams(path) {
    const matches = path.match(/:[a-zA-Z][a-zA-Z0-9]*/g);
    return matches ? matches.map((m) => m.slice(1)) : [];
}

/** URL 파라미터 설명 매핑 */
const URL_PARAM_DESCRIPTIONS = {
    id: '리소스의 고유 ID (cuid 형식)',
    slug: '리소스의 고유 주소 (소문자/숫자/하이픈)',
    contentTypeId: '콘텐츠 타입의 ID',
    contentTypeSlug: '콘텐츠 타입의 고유 주소 (예: blog)',
    version: '버전 번호 (정수)',
    filename: '백업 파일명',
    userId: '사용자 ID',
    roleId: '역할 ID',
    token: '인증 토큰',
};

function ApiGuidePage() {
    const { contentTypes } = useGlobal();
    const { makePopup, closePopup } = usePopup();
    const [activeCategory, setActiveCategory] = useState('public');
    const [activeSection, setActiveSection] = useState('public-api');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    const showQuickGuide = () => {
        makePopup(
            <AlertPopup
                title="시작하기 가이드"
                body={
                    <div className="apiQuickGuideBody">
                        <div className="apiQuickGuideSection">
                            <strong>1. URL 파라미터 교체</strong>
                            <p>
                                <code>:id</code>, <code>:slug</code> 같은 URL 파라미터는 실제 값으로 교체하세요.
                                <br />
                                예: <code>/contents/:id</code> → <code>/contents/cmnf12abc...</code>
                            </p>
                        </div>

                        <div className="apiQuickGuideSection">
                            <strong>2. 인증 헤더</strong>
                            <pre className="apiQuickGuideCode">
{`# 관리자 API
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Public API (외부 사이트)
Authorization: Bearer sk_live_xxxxxxxxxxxx`}
                            </pre>
                        </div>

                        <div className="apiQuickGuideSection">
                            <strong>3. JavaScript (fetch) 예시</strong>
                            <pre className="apiQuickGuideCode">
{`// GET 요청
const res = await fetch('${API_BASE}/contents/CONTENT_ID', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
  },
});
const data = await res.json();

// POST 요청 (요청 본문 포함)
const res = await fetch('${API_BASE}/contents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contentTypeId: 'cmnf12abc...',
    title: '제목',
    slug: 'my-post',
    data: {},
  }),
});`}
                            </pre>
                        </div>

                        <div className="apiQuickGuideSection">
                            <strong>4. 응답 형식</strong>
                            <p>목록 조회는 페이지네이션 정보를 포함합니다:</p>
                            <pre className="apiQuickGuideCode">
{`{
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}`}
                            </pre>
                        </div>
                    </div>
                }
                buttonFunction={() => closePopup()}
            />,
        );
    };

    const selectedType = contentTypes.find((ct) => ct.slug === selectedSlug);
    const allSections = buildApiSections(contentTypes, selectedType);
    const sections = allSections.filter((s) => s.category === activeCategory);
    const currentSection = sections.find((s) => s.id === activeSection) || sections[0];

    // 카테고리 전환 시 첫 섹션으로 자동 이동
    const switchCategory = (cat) => {
        setActiveCategory(cat);
        const firstSection = allSections.find((s) => s.category === cat);
        if (firstSection) setActiveSection(firstSection.id);
    };

    const copyToClipboard = async (text, id) => {
        try {
            // 모던 브라우저 (HTTPS/localhost)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // 폴백: textarea + execCommand
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('복사 실패:', err);
            alert('복사에 실패했습니다. 직접 선택하여 복사해주세요.');
        }
    };

    const CopyBtn = ({ text, id }) => (
        <button
            type="button"
            className="apiCopyBtn"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard(text, id);
            }}
            title="복사"
        >
            {copiedId === id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
    );

    const METHOD_COLOR = {
        GET: 'apiMethodGet', POST: 'apiMethodPost',
        PATCH: 'apiMethodPatch', DELETE: 'apiMethodDelete',
    };

    const buildCurl = (ep) => {
        let curl = `curl -X ${ep.method} "${API_BASE}${ep.path}"`;
        if (ep.authNote) {
            curl += ` \\\n  -H "Authorization: Bearer sk_live_YOUR_API_KEY"`;
        } else if (ep.auth) {
            curl += ` \\\n  -H "Authorization: Bearer YOUR_TOKEN"`;
        }
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
                    <button
                        type="button"
                        className="apiHelpBtn"
                        onClick={showQuickGuide}
                    >
                        <HelpCircle className="size-4" />
                        <span>시작하기 가이드</span>
                    </button>
                    <a href={`${API_BASE}/api-docs`} target="_blank" rel="noopener noreferrer" className="apiSwaggerLink">
                        <ExternalLink className="size-4" /> Swagger 문서
                    </a>
                </div>
                <p className="pageDescription">
                    이 CMS의 모든 REST API 사용법을 확인합니다
                </p>
            </div>

            {/* 카테고리 탭 */}
            <div className="apiCategoryTabs">
                <button
                    type="button"
                    className={`apiCategoryTab apiCategoryTabPublic ${activeCategory === 'public' ? 'active' : ''}`}
                    onClick={() => switchCategory('public')}
                >
                    <div className="apiCategoryTabIcon">🌐</div>
                    <div className="apiCategoryTabText">
                        <span className="apiCategoryTabTitle">외부 API</span>
                        <span className="apiCategoryTabDesc">
                            외부 프론트엔드/앱에서 발행된 콘텐츠를 가져갈 때 사용 (API 키 필요)
                        </span>
                    </div>
                </button>
                <button
                    type="button"
                    className={`apiCategoryTab apiCategoryTabAdmin ${activeCategory === 'admin' ? 'active' : ''}`}
                    onClick={() => switchCategory('admin')}
                >
                    <div className="apiCategoryTabIcon">🔐</div>
                    <div className="apiCategoryTabText">
                        <span className="apiCategoryTabTitle">관리자 API</span>
                        <span className="apiCategoryTabDesc">
                            CMS 관리 기능 (콘텐츠 작성, 사용자 관리 등) — JWT 토큰 필요
                        </span>
                    </div>
                </button>
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

                            {/* URL 파라미터 자동 추출 */}
                            {(() => {
                                const urlParams = extractUrlParams(ep.path);
                                if (urlParams.length === 0) return null;
                                return (
                                    <div className="apiParams">
                                        <span className="apiParamsLabel">URL 파라미터</span>
                                        <table className="apiParamsTable">
                                            <tbody>
                                                {urlParams.map((name) => (
                                                    <tr key={name}>
                                                        <td><code>:{name}</code></td>
                                                        <td className="apiParamType">path</td>
                                                        <td>{URL_PARAM_DESCRIPTIONS[name] || '해당 리소스의 식별자'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}

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
