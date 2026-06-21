import { imageUrlVariants, isHttpOrHttpsUrl } from "@/lib/news/image-url";

const NEWS_CDN_HOST_RE =
  /(?:^|\.)((?:vnecdn|insidevina|vietnam|laodong)\.(?:net|com|vn)|vphoto\.vietnam\.vn|naver\.(?:net|com))$/i;

const USER_AGENT =
  "Mozilla/5.0 (compatible; HokeiNewsBot/1.0; +https://hokei.vn)";
const FETCH_TIMEOUT_MS = 10_000;
const MIN_IMAGE_BYTES_HINT = 80;

/** 브라우저 직링크 시 깨지기 쉬운 URL (만료 서명 CDN 등) */
export function isUnstableThumbnailUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (/googleusercontent\.com/i.test(lower)) return true;
  return false;
}

function refererForUrl(url: string, articleUrl?: string): string | undefined {
  try {
    if (articleUrl) {
      return new URL(articleUrl).origin + "/";
    }
    return new URL(url).origin + "/";
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyImageAccessible(
  url: string,
  articleUrl?: string
): Promise<boolean> {
  const fetched = await fetchImageBytes(url, articleUrl);
  return fetched !== null;
}

/** 이미지 URL 접근 확인 — 실패 시 잠시 대기 후 재시도 */
export async function verifyImageAccessibleWithRetry(
  url: string,
  articleUrl?: string,
  attempts = 2
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    if (await verifyImageAccessible(url, articleUrl)) return true;
    if (i < attempts - 1) await sleep(450);
  }
  return false;
}

/** RSS/HTML에서 이미지 URL 추출 */
export function extractImageFromHtml(html: string): string | undefined {
  if (!html?.trim()) return undefined;

  const candidates: string[] = [];

  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<img[^>]+data-src=["']([^"']+)["']/gi,
    /<img[^>]+(?:data-original|data-lazy-src|data-url)=["']([^"']+)["']/gi,
    /src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const url = normalizeImageUrl(match[1]);
      if (url && isUsableImageUrl(url)) candidates.push(url);
    }
  }

  return pickBestImage(candidates);
}

export function parseOgImageFromHtml(html: string): string | undefined {
  const metaPatterns = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ];

  for (const pattern of metaPatterns) {
    const m = html.match(pattern);
    const url = normalizeImageUrl(m?.[1] ?? "");
    if (url && isUsableImageUrl(url)) return url;
  }

  return extractImageFromHtml(html);
}

function normalizeImageUrl(raw: string): string | undefined {
  const trimmed = raw.trim().replace(/&amp;/g, "&");
  if (!trimmed || trimmed.startsWith("data:")) return undefined;
  try {
    const url = new URL(trimmed, "https://example.com");
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}

function isUsableImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("pixel") || lower.includes("spacer") || lower.includes("1x1")) {
    return false;
  }
  if (lower.includes("logo") && !lower.includes("article")) return false;
  if (lower.includes("/image/logo/") || lower.includes("default-user.png")) {
    return false;
  }
  return (
    /\.(jpe?g|png|webp|gif)(\?|$)/i.test(lower) ||
    lower.includes("vnecdn") ||
    lower.includes("insidevina.com/news/") ||
    lower.includes("googleusercontent") ||
    lower.includes("/image/") ||
    lower.includes("thumb") ||
    lower.includes("/photo/")
  );
}

/** 뉴스 CDN — 서버 fetch는 403이어도 브라우저 직링크는 되는 경우가 많음 */
export function isLikelyNewsCdnImageUrl(url: string): boolean {
  if (!isHttpOrHttpsUrl(url)) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (NEWS_CDN_HOST_RE.test(host)) return true;
  } catch {
    return false;
  }
  const lower = url.toLowerCase();
  return (
    lower.includes("vnecdn") ||
    lower.includes("cdn.insidevina.com/news/") ||
    lower.includes("vphoto.vietnam.vn") ||
    lower.includes("media-cdn-v2.laodong.vn")
  );
}

/** ingest 저장용 — 실제 다운로드 가능한 URL만 (vnecdn 403 등 제외) */
export function isPlausibleStoredThumbnailUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || isUnstableThumbnailUrl(trimmed) || !isHttpOrHttpsUrl(trimmed)) {
    return false;
  }
  if (!isUsableImageUrl(trimmed)) return false;
  if (isLikelyNewsCdnImageUrl(trimmed) && trimmed.toLowerCase().includes("vnecdn")) {
    return false;
  }
  return (
    isLikelyNewsCdnImageUrl(trimmed) ||
    /\.(jpe?g|png|webp)(\?|$)/i.test(trimmed)
  );
}

function pickBestImage(urls: string[]): string | undefined {
  const unique = [...new Set(urls)];
  if (unique.length === 0) return undefined;

  return unique.sort((a, b) => scoreImageUrl(b) - scoreImageUrl(a))[0];
}

function scoreImageUrl(url: string): number {
  let score = 0;
  const lower = url.toLowerCase();
  if (lower.includes("1200") || lower.includes("800") || lower.includes("large")) score += 3;
  if (lower.includes("thumb") || lower.includes("medium")) score += 2;
  if (lower.includes("vnecdn") || lower.includes("googleusercontent")) score += 2;
  if (lower.includes("width=")) {
    const w = parseInt(lower.match(/width=(\d+)/)?.[1] ?? "0", 10);
    if (w >= MIN_IMAGE_BYTES_HINT) score += 1;
  }
  return score;
}

/** 기사 URL에서 og:image 등 썸네일 조회 */
export async function fetchArticleThumbnail(
  articleUrl: string
): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(articleUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) return undefined;
    const html = await res.text();
    return parseOgImageFromHtml(html.slice(0, 200_000));
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

/** RSS 썸네일 없을 때 HTML 본문 → 기사 페이지 순으로 시도 */
export async function resolveNewsThumbnail(
  link: string,
  htmlSources: (string | undefined)[]
): Promise<string | undefined> {
  for (const html of htmlSources) {
    if (!html) continue;
    const fromHtml = extractImageFromHtml(html);
    if (fromHtml) return fromHtml;
  }

  if (link.startsWith("http")) {
    const thumb = await fetchArticleThumbnail(link);
    if (thumb && !isUnstableThumbnailUrl(thumb)) {
      const normalized = await normalizeStoredThumbnailUrl(thumb, link);
      if (normalized) return normalized;
    }
  }

  return undefined;
}

/** 썸네일 해석 — 1회 재시도 후에도 실패하면 undefined */
/** DB 저장용 — http/https 원본·변형 모두 시도 */
export async function normalizeStoredThumbnailUrl(
  url: string,
  articleUrl: string
): Promise<string | undefined> {
  for (const variant of imageUrlVariants(url)) {
    const fetched = await fetchImageBytesWithRetry(variant, articleUrl);
    if (fetched) return variant;
  }
  return undefined;
}

/** 프록시/API용 — 접근 가능한 URL 하나 반환 (http·https 동등) */
export async function resolveAccessibleImageUrl(
  imageUrl: string,
  articleUrl?: string,
  options?: { forceRefetch?: boolean }
): Promise<string | undefined> {
  const forceRefetch = options?.forceRefetch ?? false;

  if (!forceRefetch) {
    for (const variant of imageUrlVariants(imageUrl)) {
      if (isUnstableThumbnailUrl(variant)) continue;
      if (await verifyImageAccessibleWithRetry(variant, articleUrl)) {
        return variant;
      }
    }
  }

  if (!articleUrl || !isHttpOrHttpsUrl(articleUrl)) return undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    const fresh = await fetchArticleThumbnail(articleUrl);
    if (fresh) {
      for (const variant of imageUrlVariants(fresh)) {
        if (isUnstableThumbnailUrl(variant)) continue;
        if (await verifyImageAccessibleWithRetry(variant, articleUrl)) {
          return variant;
        }
      }
    }
    if (attempt === 0) await sleep(500);
  }

  return undefined;
}

export async function resolveNewsThumbnailWithRetry(
  link: string,
  htmlSources: (string | undefined)[]
): Promise<string | undefined> {
  const thumb = await resolveNewsThumbnail(link, htmlSources);
  if (thumb) {
    const normalized = await normalizeStoredThumbnailUrl(thumb, link);
    if (normalized) return normalized;
  }

  if (link.startsWith("http")) {
    await sleep(500);
    const refetched = await fetchArticleThumbnail(link);
    if (refetched && !isUnstableThumbnailUrl(refetched)) {
      const normalized = await normalizeStoredThumbnailUrl(refetched, link);
      if (normalized) return normalized;
    }
  }

  return undefined;
}

export async function fetchImageBytes(
  url: string,
  articleUrl?: string
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const referer = refererForUrl(url, articleUrl);
  const headers: Record<string, string> = { "User-Agent": USER_AGENT };
  if (referer) headers.Referer = referer;

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const body = await res.arrayBuffer();
    if (body.byteLength < 200) return null;
    return { body, contentType };
  } catch {
    return null;
  }
}

export async function fetchImageBytesWithRetry(
  url: string,
  articleUrl?: string,
  attempts = 2
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await fetchImageBytes(url, articleUrl);
    if (result) return result;
    if (i < attempts - 1) await sleep(400);
  }
  return null;
}
