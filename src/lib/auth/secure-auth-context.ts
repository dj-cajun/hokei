/** FedCM — 항상 비활성 (GIS가 true일 때 localhost에서 NetworkError 로그 발생) */
export const GOOGLE_FEDCM_FOR_PROMPT = false as const;

/**
 * Google One Tap 표시 여부.
 * HTTP(localhost 포함)에서는 원탭·FedCM 없이 redirect 버튼만 사용.
 */
export function shouldEnableGoogleOneTap(): boolean {
  if (process.env.NEXT_PUBLIC_GOOGLE_DISABLE_ONE_TAP === "true") {
    return false;
  }

  if (typeof window === "undefined") return false;

  return window.location.protocol === "https:";
}
