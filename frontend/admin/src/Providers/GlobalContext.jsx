/**
 * @description
 * 서버로부터 받아온 전역 데이터를 관리하는 Context.
 * 콘텐츠 타입 목록 등 앱 전체에서 공유되는 서버 데이터를 제공합니다.
 */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAPI } from "./APIContext.jsx";
import { useUser } from "./UserContext.jsx";

const MOBILE_BREAKPOINT = 768;

const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const api = useAPI();
  const { user, accessToken } = useUser();

  /** 반응형 — isMobile */
  const [isMobile, setIsMobile] = useState(
    () => window.innerWidth <= MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /** 사이드바 열림/닫힘 (모바일 전용) */
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 모바일→데스크톱 전환 시 사이드바 닫기
  useEffect(() => {
    if (!isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const { data: contentTypes = [] } = useQuery({
    queryKey: ["content-types"],
    queryFn: () => api.get("/content-types").then((r) => r.data),
    enabled: !!user && !!accessToken,
  });

  /** 시스템 설정 */
  const { data: settings = {} } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get("/settings").then((r) => r.data),
    enabled: !!user && !!accessToken,
  });

  /** 파비콘 동적 적용 */
  useEffect(() => {
    if (settings.faviconUrl) {
      const base = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const url = settings.faviconUrl.startsWith("http")
        ? settings.faviconUrl
        : `${base}${settings.faviconUrl}`;
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    }
  }, [settings.faviconUrl]);

  return (
    <GlobalContext.Provider value={{ contentTypes, settings, isMobile, sidebarOpen, setSidebarOpen }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  return useContext(GlobalContext);
}
