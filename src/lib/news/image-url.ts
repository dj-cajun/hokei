/** 뉴스 이미지 URL — http/https 구분 없이 서버에서 fetch */

export function isHttpOrHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** 동일 경로의 반대 프로토콜 (http ↔ https) */
export function alternateProtocolUrl(url: string): string | undefined {
  if (url.startsWith("https://")) {
    return url.replace(/^https:\/\//i, "http://");
  }
  if (url.startsWith("http://")) {
    return url.replace(/^http:\/\//i, "https://");
  }
  return undefined;
}

/** 접근 시도 순서: 원본 → 반대 프로토콜 */
export function imageUrlVariants(url: string): string[] {
  const trimmed = url.trim();
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (candidate: string) => {
    if (!candidate || !isHttpOrHttpsUrl(candidate) || seen.has(candidate)) return;
    seen.add(candidate);
    out.push(candidate);
  };

  add(trimmed);
  const alt = alternateProtocolUrl(trimmed);
  if (alt) add(alt);

  return out;
}
