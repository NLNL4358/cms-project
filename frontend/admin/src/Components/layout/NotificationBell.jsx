/**
 * @description
 * 헤더 알림 벨 아이콘 + 드롭다운
 * WebSocket으로 실시간 알림 수신, 클릭 시 최근 알림 목록 표시
 */
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Bell, CheckCheck, X } from 'lucide-react';

import { useAPI } from '@/Providers/APIContext.jsx';
import { useUser } from '@/Providers/UserContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function NotificationBell() {
    const api = useAPI();
    const { user, accessToken } = useUser();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const socketRef = useRef(null);

    // WebSocket 연결
    useEffect(() => {
        if (!user || !accessToken) return;

        const socket = io(`${API_URL}/notifications`, {
            auth: { token: accessToken },
            transports: ['websocket'],
        });

        socket.on('notification', () => {
            // 새 알림 도착 → 캐시 갱신
            queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, accessToken, queryClient]);

    // 안 읽은 수
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications-unread'],
        queryFn: () =>
            api.get('/notifications/unread-count').then((r) => r.data),
        enabled: !!user,
    });

    // 알림 목록 (드롭다운 열렸을 때만)
    const { data: notifData } = useQuery({
        queryKey: ['notifications'],
        queryFn: () =>
            api.get('/notifications?limit=10').then((r) => r.data),
        enabled: !!user && open,
        refetchOnMount: 'always',
    });

    const notifications = notifData?.data || [];

    // 단건 읽음
    const readMutation = useMutation({
        mutationFn: (id) => api.post(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({
                queryKey: ['notifications-unread'],
            });
        },
    });

    // 전체 읽음
    const readAllMutation = useMutation({
        mutationFn: () => api.post('/notifications/read-all'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({
                queryKey: ['notifications-unread'],
            });
        },
    });

    // 삭제
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/notifications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({
                queryKey: ['notifications-unread'],
            });
        },
    });

    // 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClick = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const formatTime = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '방금 전';
        if (mins < 60) return `${mins}분 전`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        return `${days}일 전`;
    };

    return (
        <div className="notifBellWrap" ref={dropdownRef}>
            <button
                className="notifBellBtn"
                onClick={() => setOpen(!open)}
                title="알림"
            >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                    <span className="notifBadge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="notifDropdown">
                    <div className="notifDropdownHeader">
                        <span className="notifDropdownTitle">알림</span>
                        {unreadCount > 0 && (
                            <button
                                className="notifReadAllBtn"
                                onClick={() => readAllMutation.mutate()}
                            >
                                <CheckCheck className="size-3.5" />
                                모두 읽음
                            </button>
                        )}
                    </div>

                    <div className="notifDropdownList">
                        {notifications.length === 0 ? (
                            <div className="notifEmpty">알림이 없습니다</div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`notifItem ${n.isRead ? '' : 'notifItemUnread'}`}
                                >
                                    <div
                                        className="notifItemContent"
                                        onClick={() => {
                                            if (!n.isRead)
                                                readMutation.mutate(n.id);
                                        }}
                                    >
                                        {!n.isRead && (
                                            <span className="notifDot" />
                                        )}
                                        <div className="notifItemText">
                                            <span className="notifItemTitle">
                                                {n.title}
                                            </span>
                                            <span className="notifItemMsg">
                                                {n.message}
                                            </span>
                                            <span className="notifItemTime">
                                                {formatTime(n.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="notifItemDelete"
                                        onClick={() =>
                                            deleteMutation.mutate(n.id)
                                        }
                                        title="삭제"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationBell;
