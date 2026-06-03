import { safeCallbackPath } from "@/lib/auth/safe-callback-url";

const STATE_PREFIX = "p:";

function toBase64Url(value: string): string {
  const bytes =
    typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(value)
      : Buffer.from(value, "utf8");

  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const byte of arr) {
    binary += String.fromCharCode(byte);
  }

  const b64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(value, "utf8").toString("base64");

  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  const binary =
    typeof atob !== "undefined"
      ? atob(padded)
      : Buffer.from(padded, "base64").toString("binary");

  if (typeof TextDecoder !== "undefined") {
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(binary, "binary").toString("utf8");
}

/** Kakao authorize용 state — `/` 이면 생략(undefined), 그 외 base64url */
export function encodeKakaoOAuthState(path: string): string | undefined {
  const safe = safeCallbackPath(path);
  if (safe === "/") return undefined;
  return toBase64Url(`${STATE_PREFIX}${safe}`);
}

export function decodeKakaoOAuthState(raw: string | null | undefined): string {
  if (!raw?.trim()) return "/";

  const trimmed = raw.trim();

  if (trimmed.startsWith("/")) {
    return safeCallbackPath(trimmed);
  }

  try {
    const decoded = fromBase64Url(trimmed);
    if (decoded.startsWith(STATE_PREFIX)) {
      return safeCallbackPath(decoded.slice(STATE_PREFIX.length));
    }
  } catch {
    /* legacy encodeURIComponent */
  }

  try {
    return safeCallbackPath(decodeURIComponent(trimmed));
  } catch {
    return safeCallbackPath(trimmed);
  }
}
