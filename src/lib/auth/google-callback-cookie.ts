import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

export const GOOGLE_CALLBACK_COOKIE = "hokei_google_callback";
const MAX_AGE_SEC = 600;

/** redirect 로그인 전 복귀 경로 저장 (서버 POST에서 읽음) */
export function setGoogleCallbackCookie(path: string): void {
  if (typeof document === "undefined") return;
  const safe = safeCallbackPath(path);
  document.cookie = `${GOOGLE_CALLBACK_COOKIE}=${encodeURIComponent(safe)}; path=/; max-age=${MAX_AGE_SEC}; SameSite=Lax`;
}

export function readGoogleCallbackFromCookie(
  cookieHeader: string | null
): string {
  if (!cookieHeader) return "/";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${GOOGLE_CALLBACK_COOKIE}=([^;]+)`)
  );
  if (!match?.[1]) return "/";
  try {
    return safeCallbackPath(decodeURIComponent(match[1]));
  } catch {
    return safeCallbackPath(match[1]);
  }
}
