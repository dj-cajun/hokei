/**
 * 공개 사이트 URL — 빈 문자열·미설정 시 Vercel/로컬 fallback
 * (빈 NEXT_PUBLIC_SITE_URL은 metadataBase new URL('') 빌드 실패 원인)
 */
export function resolveSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3001";
}
