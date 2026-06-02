/** 카카오 OAuth redirect_uri — authorize·토큰 교환 시 동일 문자열 필수 */
export const KAKAO_CALLBACK_PATH = "/api/auth/kakao/callback";

export function buildKakaoRedirectUri(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${KAKAO_CALLBACK_PATH}`;
}

/**
 * 서버: 요청 origin 우선 (KOE320 방지)
 * 클라이언트: 현재 브라우저 origin (SDK authorize와 동일)
 */
export function getKakaoRedirectUri(origin?: string): string {
  if (typeof window !== "undefined") {
    return buildKakaoRedirectUri(window.location.origin);
  }
  const base =
    origin?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "";
  return base ? buildKakaoRedirectUri(base) : "";
}
