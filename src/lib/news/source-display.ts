/** 수집·DB용 — (스크래핑)·네이버·VnExpress 조합 라벨 제거 */

const SCRAPE_TAG = /\s*\(스크래핑\)\s*/gi;

const FEED_AGGREGATOR =
  /^(네이버(\s*뉴스)?(\s*[·\/|.]\s*)?(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)?|VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)$/i;

const GENERIC_SOURCE_LABEL = /^(뉴스|news|뉴스1)$/i;

const HOST_PUBLISHER_LABELS: Record<string, string> = {
  "shinailbo.co.kr": "신아일보",
  "chosun.com": "조선일보",
  "joongang.co.kr": "중앙일보",
  "hani.co.kr": "한겨레",
  "mk.co.kr": "매일경제",
  "hankyung.com": "한국경제",
  "yna.co.kr": "연합뉴스",
  "news1.kr": "뉴스1",
};

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

    if (HOST_PUBLISHER_LABELS[host]) return HOST_PUBLISHER_LABELS[host];

    const base = host.split(".").slice(0, -1).join(".") || host;
    if (base && base !== host) return base;
    return host || null;
  } catch {
    return null;
  }
}

/** 제목 끝 `- 인사이드비나`, `| 조선일보` 등 신문·매체명 접미사 */
const TITLE_PUBLISHER_SUFFIX =
  /\s*[-–—|｜·]\s*(?:인사이드비나(?:\s*[·\/|]\s*[^\s|·\/-]+)?|Vietnam\.vn|라오동(?:신문)?|VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스|신아일보|조선일보|중앙일보|한겨레|경향신문|매일경제|한국경제|서울(?:경제)?(?:신문)?|연합뉴스|뉴시스|이데일리|아시아경제|오센|디스이즈게임|더퍼블릭|헤럴드경제|머니투데이|서울신문|KBS|SBS|YTN|MBC|JTBC|뉴스1|파이낸셜(?:뉴스|리뷰)?|블로터|ZDNET|전자신문|(?:경|전|충|강|제)?(?:북|남)?도민일보|(?:경|전|충|강|제)?(?:도)?민일보)(?:\s*기자)?\s*\)?\s*$/iu;

function publisherNamesForTitleStrip(
  meta?: { sourceName?: string | null; sourceUrl?: string | null }
): string[] {
  const names = new Set<string>();
  const stored = meta?.sourceName
    ? sanitizeStoredSourceName(meta.sourceName)
    : null;
  if (stored) {
    names.add(stored);
    const base = stored.split(/\s*[·\/|]\s*/)[0]?.trim();
    if (base && base !== stored) names.add(base);
  }
  if (meta?.sourceUrl?.startsWith("http")) {
    const fromUrl = publisherLabelFromUrl(meta.sourceUrl);
    if (fromUrl) names.add(fromUrl);
  }
  return [...names];
}

/** 수집·표시용 — 제목에서 매체명 접미사 제거 (출처는 sourceName·링크로 표시) */
export function sanitizeNewsPostTitle(
  title: string,
  meta?: { sourceName?: string | null; sourceUrl?: string | null }
): string {
  let t = title.trim();
  if (!t) return t;

  for (const name of publisherNamesForTitleStrip(meta)) {
    if (name.length < 2) continue;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t
      .replace(
        new RegExp(
          `\\s*[-–—|｜·]\\s*${esc}(?:\\s*[·\\/|]\\s*[^-|·\\/\\s]+)?(?:\\s*기자)?\\s*\\)?\\s*$`,
          "iu"
        ),
        ""
      )
      .trim();
  }

  t = t.replace(TITLE_PUBLISHER_SUFFIX, "").trim();
  t = t.replace(/\(\s*$/, "").trim();
  return t;
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
  if (
    cleaned &&
    !FEED_AGGREGATOR.test(cleaned) &&
    !GENERIC_SOURCE_LABEL.test(cleaned)
  ) {
    return cleaned;
  }

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
