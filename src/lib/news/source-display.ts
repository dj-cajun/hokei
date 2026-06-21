/** 수집·DB용 — (스크래핑)·네이버·VnExpress 조합 라벨 제거 */

const SCRAPE_TAG = /\s*\(스크래핑\)\s*/gi;

const FEED_AGGREGATOR =
  /^(네이버(\s*뉴스)?(\s*[·\/|.]\s*)?(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)?|VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)$/i;

function cleanSourceNameForDisplay(name: string): string {
  return name
    .replace(SCRAPE_TAG, " ")
    .replace(/^네이버\s*([·\/|.]\s*)?/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function publisherLabelFromUrl(sourceUrl: string): string | null {
  try {
    const host = new URL(sourceUrl).hostname
      .toLowerCase()
      .replace(/^www\.|^m\.|^n\./, "");

    if (/^ko\.laodong\.vn$|^laodong\.vn$/.test(host)) return "라오동신문";
    if (/insidevina\.com$/.test(host)) return "인사이드비나";
    if (/vietnam\.vn$/.test(host)) return "Vietnam.vn";
    if (/vnexpress\.net$/.test(host)) return "VnExpress";
    if (/news\.naver\.com$/.test(host)) return "네이버 뉴스";

    const base = host.split(".").slice(0, -1).join(".") || host;
    if (base && base !== host) return base;
    return host || null;
  } catch {
    return null;
  }
}

export function sanitizeStoredSourceName(
  name?: string | null
): string | null {
  if (!name?.trim()) return null;
  const s = cleanSourceNameForDisplay(name);
  if (!s || FEED_AGGREGATOR.test(s)) return null;
  return s;
}

/** 기사 상단(썸네일 아래) — 신문·매체명 (원문 링크 텍스트) */
export function formatPostSourceAttribution(
  name?: string | null,
  sourceUrl?: string
): string | null {
  const cleaned = name?.trim() ? cleanSourceNameForDisplay(name) : "";
  if (cleaned && !FEED_AGGREGATOR.test(cleaned)) return cleaned;

  if (sourceUrl?.startsWith("http")) {
    return publisherLabelFromUrl(sourceUrl);
  }

  return null;
}

/** 메타 줄 — 수집용 매체명은 표시하지 않음 (레거시) */
export function formatPostSourceLabel(
  name?: string | null
): string | null {
  return sanitizeStoredSourceName(name);
}
