/**
 * @description
 * 감사 로그 목록 페이지
 * 시스템 전체 활동 로그를 조회합니다 (필터 + 페이지네이션)
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ScrollText,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
} from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { usePopup } from '@/Providers/PopupContext';
import { Button } from '@/Components/ui/Button.jsx';
import { Input } from '@/Components/ui/Input.jsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/Select.jsx';
import AlertPopup from '@/Components/common/AlertPopup.jsx';
import '@/CSS/local/audit-log.css';

/** 액션별 한국어 라벨 */
const ACTION_LABELS = {
    CREATE: '생성',
    UPDATE: '수정',
    DELETE: '삭제',
    LOGIN: '로그인',
    LOGOUT: '로그아웃',
};

/** 액션별 배지 색상 클래스 */
const ACTION_BADGE = {
    CREATE: 'auditBadgeGreen',
    UPDATE: 'auditBadgeBlue',
    DELETE: 'auditBadgeRed',
    LOGIN: 'auditBadgePurple',
    LOGOUT: 'auditBadgeGray',
};

function AuditLogList() {
    const api = useAPI();
    const { makePopup, closePopup } = usePopup();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [entityFilter, setEntityFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const limit = 20;

    // 로그 목록 — 항상 최신 데이터로 가져옴
    const { data, isLoading } = useQuery({
        queryKey: [
            'audit-logs',
            page,
            search,
            actionFilter,
            entityFilter,
            startDate,
            endDate,
        ],
        queryFn: () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (search) params.set('search', search);
            if (actionFilter) params.set('action', actionFilter);
            if (entityFilter) params.set('entity', entityFilter);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);
            return api.get(`/audit-logs?${params}`).then((r) => r.data);
        },
        refetchOnMount: 'always',
        staleTime: 0,
    });

    // 필터용 액션/엔티티 목록
    const { data: actions = [] } = useQuery({
        queryKey: ['audit-log-actions'],
        queryFn: () => api.get('/audit-logs/actions').then((r) => r.data),
        refetchOnMount: 'always',
    });

    const { data: entities = [] } = useQuery({
        queryKey: ['audit-log-entities'],
        queryFn: () => api.get('/audit-logs/entities').then((r) => r.data),
        refetchOnMount: 'always',
    });

    const logs = data?.data || [];
    const meta = data?.meta || { total: 0, page: 1, totalPages: 1 };

    // 상세 보기 팝업
    const showDetail = (log) => {
        makePopup(
            <AlertPopup
                title="로그 상세"
                body={
                    <div className="auditDetailBody">
                        <div className="auditDetailRow">
                            <span className="auditDetailLabel">일시</span>
                            <span>
                                {new Date(log.occurredAt).toLocaleString(
                                    'ko-KR',
                                )}
                            </span>
                        </div>
                        <div className="auditDetailRow">
                            <span className="auditDetailLabel">액션</span>
                            <span
                                className={`auditBadge ${ACTION_BADGE[log.action] || 'auditBadgeGray'}`}
                            >
                                {ACTION_LABELS[log.action] || log.action}
                            </span>
                        </div>
                        <div className="auditDetailRow">
                            <span className="auditDetailLabel">대상</span>
                            <span>
                                {log.entity} / {log.entityId}
                            </span>
                        </div>
                        <div className="auditDetailRow">
                            <span className="auditDetailLabel">사용자</span>
                            <span>
                                {log.userEmail || log.userName || log.userId || '-'}
                            </span>
                        </div>
                        <div className="auditDetailRow">
                            <span className="auditDetailLabel">IP</span>
                            <span>{log.ipAddress || '-'}</span>
                        </div>
                        {log.newData && (
                            <div className="auditDetailData">
                                <span className="auditDetailLabel">
                                    변경 데이터
                                </span>
                                <pre className="auditDetailPre">
                                    {JSON.stringify(log.newData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                }
                buttonFunction={() => closePopup()}
            />,
        );
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="formPageWrap">
            <div className="formPageHead">
                <div className="flex gap-3 items-center">
                    <div className="settingsIcon">
                        <ScrollText className="size-5" />
                    </div>
                    <h2 className="text-2xl font-bold">감사 로그</h2>
                </div>
                <p className="pageDescription">
                    시스템 전체 활동 이력을 확인합니다 (누가, 언제, 무엇을,
                    어떻게)
                </p>
            </div>

            {/* 필터 바 */}
            <div className="sectionBox auditFilterBox">
                <div className="auditFilterRow">
                    <div className="auditSearchWrap">
                        <Search className="auditSearchIcon" />
                        <Input
                            placeholder="검색..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="auditSearchInput"
                        />
                    </div>
                    <Select
                        value={actionFilter || 'all'}
                        onValueChange={(v) => {
                            setActionFilter(v === 'all' ? '' : v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="auditFilterSelect">
                            <SelectValue placeholder="액션 전체" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">액션 전체</SelectItem>
                            {actions.map((a) => (
                                <SelectItem key={a} value={a}>
                                    {ACTION_LABELS[a] || a}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={entityFilter || 'all'}
                        onValueChange={(v) => {
                            setEntityFilter(v === 'all' ? '' : v);
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="auditFilterSelect">
                            <SelectValue placeholder="대상 전체" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">대상 전체</SelectItem>
                            {entities.map((e) => (
                                <SelectItem key={e} value={e}>
                                    {e}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="auditFilterRow">
                    <div className="auditDateGroup">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                setStartDate(e.target.value);
                                setPage(1);
                            }}
                            className="auditDateInput"
                        />
                        <span className="auditDateSep">~</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setPage(1);
                            }}
                            className="auditDateInput"
                        />
                    </div>
                    <span className="auditResultCount">
                        총 {meta.total}건
                    </span>
                </div>
            </div>

            {/* 로그 테이블 */}
            <div className="sectionBox">
                {isLoading ? (
                    <div className="auditLoading">불러오는 중...</div>
                ) : logs.length === 0 ? (
                    <div className="auditEmpty">
                        <ScrollText className="size-10 text-muted-foreground" />
                        <p>기록된 로그가 없습니다</p>
                    </div>
                ) : (
                    <div className="auditTableWrap">
                        <table className="auditTable">
                            <thead>
                                <tr>
                                    <th>일시</th>
                                    <th>사용자</th>
                                    <th>액션</th>
                                    <th>대상</th>
                                    <th>IP</th>
                                    <th>상세</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="auditCellDate">
                                            {formatDate(log.occurredAt)}
                                        </td>
                                        <td className="auditCellUser">
                                            {log.userEmail || '-'}
                                        </td>
                                        <td>
                                            <span
                                                className={`auditBadge ${ACTION_BADGE[log.action] || 'auditBadgeGray'}`}
                                            >
                                                {ACTION_LABELS[log.action] ||
                                                    log.action}
                                            </span>
                                        </td>
                                        <td className="auditCellEntity">
                                            {log.entity}
                                        </td>
                                        <td className="auditCellIp">
                                            {log.ipAddress || '-'}
                                        </td>
                                        <td>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                    showDetail(log)
                                                }
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            {meta.totalPages > 1 && (
                <div className="auditPagination">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                    <span className="auditPageInfo">
                        {meta.page} / {meta.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage(page + 1)}
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

export default AuditLogList;
