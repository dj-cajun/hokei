/** 로그인 후 리다이렉트 — 동일 오리진 상대 경로만 허용 */
export function safeCallbackPath(raw: string | null | undefined): string {
  const fallback = "/";
  if (!raw?.trim()) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/api/")) return fallback;
  return value;
}
