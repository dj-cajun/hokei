export const GOOGLE_REDIRECT_LOGIN_PATH = "/api/auth/google/redirect";

export function getGoogleRedirectLoginUri(origin?: string): string {
  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
    "";
  return base ? `${base}${GOOGLE_REDIRECT_LOGIN_PATH}` : "";
}
