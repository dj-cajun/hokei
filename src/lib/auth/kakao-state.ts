import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

export function encodeKakaoOAuthState(path: string): string | undefined {
  const safe = safeCallbackPath(path);
  if (safe === "/") return undefined;
  return encodeURIComponent(safe);
}

export function decodeKakaoOAuthState(raw: string | null | undefined): string {
  if (!raw?.trim()) return "/";
  try {
    return safeCallbackPath(decodeURIComponent(raw.trim()));
  } catch {
    return safeCallbackPath(raw.trim());
  }
}
