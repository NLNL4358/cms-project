/**
 * @description
 * 서버로부터 받아온 전역 데이터를 관리하는 Context.
 * 콘텐츠 타입 목록 등 앱 전체에서 공유되는 서버 데이터를 제공합니다.
 */
import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAPI } from "./APIContext.jsx";
import { useUser } from "./UserContext.jsx";

const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const api = useAPI();
  const { user, accessToken } = useUser();

  const { data: contentTypes = [] } = useQuery({
    queryKey: ["content-types"],
    queryFn: () => api.get("/content-types").then((r) => r.data),
    enabled: !!user && !!accessToken, // 로그인된 사용자 AND accessToken이 있을 때만 실행
  });

  return (
    <GlobalContext.Provider value={{ contentTypes }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  return useContext(GlobalContext);
}
