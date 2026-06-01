const LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

function originFromUrl(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** 비회원 업로드: 사이트 출처(Referer/Origin) 확인 */
export function isAllowedUploadOrigin(request: Request): boolean {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  const allowed = new Set<string>(LOCAL_ORIGINS);
  if (site) allowed.add(site);

  const referer = request.headers.get("referer");
  const origin = request.headers.get("origin");

  for (const raw of [referer, origin]) {
    if (!raw) continue;
    const o = originFromUrl(raw);
    if (o && allowed.has(o)) return true;
  }

  if (process.env.NODE_ENV === "development" && !site) {
    return true;
  }

  return false;
}
