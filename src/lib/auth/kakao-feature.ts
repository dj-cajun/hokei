/**
 * 카카오 로그인 UI·SDK — 기본 비활성.
 * Vercel/.env 에 NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true 로 켜기.
 */
export function isKakaoLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED === "true";
}
