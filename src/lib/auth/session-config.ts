/** NextAuth JWT 세션 — 30일 유지, 24h마다 슬라이딩 갱신 */
export const AUTH_SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
export const AUTH_SESSION_UPDATE_AGE_SEC = 24 * 60 * 60;

/** jwt 콜백 DB role·정지 상태 동기화 간격 */
export const AUTH_JWT_USER_SYNC_MS = 5 * 60 * 1000;

export const authSessionOptions = {
  strategy: "jwt" as const,
  maxAge: AUTH_SESSION_MAX_AGE_SEC,
  updateAge: AUTH_SESSION_UPDATE_AGE_SEC,
};
