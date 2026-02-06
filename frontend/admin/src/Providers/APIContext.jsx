/**
 * @description
 * 서버와의 통신관련 Context로 프로젝트내 Rest API 요청및 수신, Data return등의
 * 서버에 요청은 이곳을 통해서만 이루어집니다.
 *
 * - Axios 인스턴스 생성 및 제공
 * - 요청 인터셉터: accessToken 첨부 + 로딩 스피너 표시 (ref 기반)
 * - 응답 인터셉터: 401 시 토큰 갱신 후 재시도 + 로딩 스피너 숨김
 */
import React, { createContext, useContext, useEffect, createRef } from "react";
import axios from "axios";
import { toast } from "sonner";

import { usePopup } from "./PopupContext";

const APIContext = createContext();

// 모듈 레벨 ref — UserProvider에서 업데이트
export const tokenRef = createRef();
tokenRef.current = { accessToken: null, refresh: null, logout: null };

// 모듈 레벨 ref — PopupProvider에서 업데이트
export const popupRef = createRef();
popupRef.current = { makeProgressPopup: null, closeProgressPopup: null };

// 모듈 레벨에서 인스턴스를 한 번만 생성
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터 — 로딩 스피너 표시 + accessToken 첨부
instance.interceptors.request.use((config) => {
  // 로딩 스피너 표시
  if (popupRef.current?.makeProgressPopup) {
    popupRef.current.makeProgressPopup();
  }

  // accessToken 첨부
  if (tokenRef.current.accessToken) {
    config.headers.Authorization = `Bearer ${tokenRef.current.accessToken}`;
  }
  return config;
});

// 응답 인터셉터 — 로딩 스피너 숨김 + 401 시 토큰 갱신 후 재시도
instance.interceptors.response.use(
  (response) => {
    // 성공 응답: 로딩 스피너 숨김
    if (popupRef.current?.closeProgressPopup) {
      popupRef.current.closeProgressPopup();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // refresh 함수가 있고 호출 가능한지 확인
      if (tokenRef.current?.refresh && typeof tokenRef.current.refresh === 'function') {
        try {
          await tokenRef.current.refresh();
          originalRequest.headers.Authorization = `Bearer ${tokenRef.current.accessToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // refresh 실패 시 로그아웃 처리
          if (tokenRef.current?.logout && typeof tokenRef.current.logout === 'function') {
            tokenRef.current.logout();
          }
          // 로딩 스피너 숨김
          if (popupRef.current?.closeProgressPopup) {
            popupRef.current.closeProgressPopup();
          }
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // refresh 함수가 없으면 바로 로그인 페이지로
        if (popupRef.current?.closeProgressPopup) {
          popupRef.current.closeProgressPopup();
        }
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // 에러 유형별 toast 알림
    if (!error.response) {
      // 네트워크 에러 — 서버 자체에 도달 불가
      toast.error("서버에 연결할 수 없습니다.", {
        description: "백엔드 서버가 실행 중인지 확인해주세요.",
      });
    } else if (error.response.status === 403) {
      toast.error("접근 권한이 없습니다.");
    } else if (error.response.status === 429) {
      toast.error("요청이 너무 많습니다.", {
        description: "잠시 후 다시 시도해주세요.",
      });
    } else if (error.response.status >= 500) {
      toast.error("서버 오류가 발생했습니다.", {
        description: error.response.data?.message || "잠시 후 다시 시도해주세요.",
      });
    }

    // 에러 응답: 로딩 스피너 숨김
    if (popupRef.current?.closeProgressPopup) {
      popupRef.current.closeProgressPopup();
    }
    return Promise.reject(error);
  },
);

export function APIProvider({ children }) {
  const { makeProgressPopup, closeProgressPopup } = usePopup();

  // popupRef 동기화 — 인터셉터가 참조
  useEffect(() => {
    popupRef.current = { makeProgressPopup, closeProgressPopup };
  }, [makeProgressPopup, closeProgressPopup]);

  return <APIContext.Provider value={instance}>{children}</APIContext.Provider>;
}

export function useAPI() {
  return useContext(APIContext);
}
