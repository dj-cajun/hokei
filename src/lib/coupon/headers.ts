/** HTTP 헤더는 ByteString(ASCII)만 허용 — 한글 등은 encodeURIComponent */

export function encodeHeaderValue(value: string): string {
  return encodeURIComponent(value);
}

export function decodeHeaderValue(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

export function hokeiSessionHeaders(user: {
  id: string;
  email?: string | null;
  name?: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "X-User-Id": user.id,
  };
  if (user.email) {
    headers["X-User-Email"] = encodeHeaderValue(user.email);
  }
  if (user.name) {
    headers["X-User-Name"] = encodeHeaderValue(user.name);
  }
  return headers;
}
