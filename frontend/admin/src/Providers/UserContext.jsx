/**
 * @description
 * User에 관련된 전역State를 관리하는 Provider.
 * 로그인한 유저의 정보 및 권한, 토큰등의 전역으로 관리될 정보를 수집 및 관리합니다.
 *
 * - accessToken: 메모리에만 유지 (보안)
 * - refreshToken, user: localStorage에 persist
 * - login, refresh, logout 액션 제공
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAPI, tokenRef } from './APIContext.jsx';

const UserContext = createContext();

export function UserProvider({ children }) {
    /**Provider */
    const api = useAPI(); // ← APIProvider의 axios 인스턴스 사용

    /**useState */
    const [user, setUser] = useState(() => {
        try {
            const s = localStorage.getItem('cms-admin-user');
            return s ? JSON.parse(s) : null;
        } catch {
            return null;
        }
    });

    const [accessToken, setAccessToken] = useState(null);

    const [refreshToken, setRefreshToken] = useState(
        () => localStorage.getItem('cms-admin-refresh-token') || null,
    );

    /**useEffect */
    // localStorage 동기화
    useEffect(() => {
        if (user) localStorage.setItem('cms-admin-user', JSON.stringify(user));
        else localStorage.removeItem('cms-admin-user');
    }, [user]);

    useEffect(() => {
        if (refreshToken)
            localStorage.setItem('cms-admin-refresh-token', refreshToken);
        else localStorage.removeItem('cms-admin-refresh-token');
    }, [refreshToken]);

    /**Function*/
    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
    };

    const refresh = async () => {
        if (!refreshToken) throw new Error('refreshToken 없음');
        const { data } = await api.post('/auth/refresh', { refreshToken });
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setUser(data.user);
    };

    const logout = () => {
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
    };

    // 앱 시작 시 refreshToken이 있으면 자동으로 accessToken 갱신
    useEffect(() => {
        if (refreshToken && !accessToken) {
            refresh().catch(() => logout());
        }
    }, []); // 마운트 시 1회만 실행

    // tokenRef 동기화 — APIProvider의 인터셉터가 참조
    useEffect(() => {
        tokenRef.current = { accessToken, refresh, logout };
    }, [accessToken, refresh, logout]);

    return (
        <UserContext.Provider
            value={{ user, accessToken, login, logout, refresh }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
