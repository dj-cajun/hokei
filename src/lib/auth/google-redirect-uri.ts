import { resolveSiteUrl } from "@/lib/site-url";

export const GOOGLE_REDIRECT_LOGIN_PATH = "/api/auth/google/redirect";

export function getGoogleRedirectLoginUri(origin?: string): string {
  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined"
      ? window.location.origin
      : resolveSiteUrl());
  return `${base}${GOOGLE_REDIRECT_LOGIN_PATH}`;
}
