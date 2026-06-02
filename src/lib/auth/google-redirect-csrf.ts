/** GIS redirect 모드 — g_csrf_token 쿠키·POST 본문 일치 검증 */
export function verifyGoogleRedirectCsrf(
  cookieHeader: string | null,
  bodyToken: string | null | undefined
): boolean {
  if (!bodyToken?.trim()) return false;

  const cookies = cookieHeader ?? "";
  const match = cookies.match(/(?:^|;\s*)g_csrf_token=([^;]+)/);
  const cookieToken = match?.[1] ? decodeURIComponent(match[1]) : null;

  return Boolean(cookieToken && cookieToken === bodyToken.trim());
}
