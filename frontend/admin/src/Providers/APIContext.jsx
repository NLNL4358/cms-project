/**
 * @description
 * 서버와의 통신관련 Context로 프로젝트내 Rest API 요청및 수신, Data return등의
 * 서버에 요청은 이곳을 통해서만 이루어집니다.
 *
 * - Axios 인스턴스 생성 및 제공
 * - 요청 인터셉터: accessToken 첨부 (ref 기반)
 * - 응답 인터셉터: 401 시 토큰 갱신 후 재시도
 */
import React, { createContext, useContext, useRef, createRef } from "react";
import axios from "axios";

const APIContext = createContext();

// 모듈 레벨 ref — UserProvider에서 업데이트
export const tokenRef = createRef();
tokenRef.current = { accessToken: null, refresh: null, logout: null };

// 모듈 레벨에서 인스턴스를 한 번만 생성
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터 — accessToken 첨부
instance.interceptors.request.use((config) => {
  if (tokenRef.current.accessToken) {
    config.headers.Authorization = `Bearer ${tokenRef.current.accessToken}`;
  }
  return config;
});

// 응답 인터셉터 — 401 시 토큰 갱신 후 재시도
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await tokenRef.current.refresh();
        originalRequest.headers.Authorization = `Bearer ${tokenRef.current.accessToken}`;
        return instance(originalRequest);
      } catch {
        tokenRef.current.logout();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export function APIProvider({ children }) {
  return <APIContext.Provider value={instance}>{children}</APIContext.Provider>;
}

export function useAPI() {
  return useContext(APIContext);
}
