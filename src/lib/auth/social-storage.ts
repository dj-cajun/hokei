/** 소셜 로그인 — 브라우저 측 상태 (원탭 무한 루프 방지) */

const GOOGLE_DISABLE_AUTO_SELECT_KEY = "hokei_google_disable_auto_select";

/**
 * 사용자가 의도적으로 로그아웃한 경우 true.
 * Google One Tap `auto_select`를 끄고 `disableAutoSelect()`를 호출해야 함.
 */
export function isGoogleAutoSelectDisabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GOOGLE_DISABLE_AUTO_SELECT_KEY) === "1";
}

/** 로그아웃 시 호출 — 이후 방문에서 원탭 자동 선택 비활성화 */
export function markGoogleAutoSelectDisabled(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOOGLE_DISABLE_AUTO_SELECT_KEY, "1");
  window.google?.accounts?.id?.disableAutoSelect();
}

/** 구글 소셜 로그인 성공 후 — 자동 선택 다시 허용 */
export function clearGoogleAutoSelectDisabled(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GOOGLE_DISABLE_AUTO_SELECT_KEY);
}
