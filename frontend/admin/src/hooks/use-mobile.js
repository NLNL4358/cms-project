/**
 * @description
 * Shadcn/ui의 Sidebar 컴포넌트가 의존하는 모바일 감지 훅입니다.
 * 화면 너비가 768px 미만이면 모바일로 판단합니다.
 *
 * @note Shadcn/ui 표준 구조 유지를 위해 hooks/ 폴더에 위치합니다.
 */
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}
