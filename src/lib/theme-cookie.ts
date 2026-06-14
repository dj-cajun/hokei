export const THEME_COOKIE = "hokei-theme";

/** SSR용 — explicit dark만 서버에서 반영 (system은 클라이언트에서 처리) */
export function darkClassFromThemeCookie(
  value: string | undefined
): "dark" | "" {
  return value === "dark" ? "dark" : "";
}
