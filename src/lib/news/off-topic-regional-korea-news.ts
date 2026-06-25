/** 지역·도 단위 신문 매체명 (경북도민일보, ○○시민신문 등) */
export const REGIONAL_KOREA_NEWS_SOURCE_NAME =
  /(?:^|[\s·\-])(?:경기|강원|경남|경북|전남|전북|충남|충북|제주)?(?:도)?민일보|[가-힣]{2,5}(?:시|군)민(?:신문|일보)|지역(?:일보|신문)/i;

/** 지역신문 도메인 (originallink) */
const REGIONAL_KOREA_NEWS_HOST =
  /(?:^|\.)(?:idomin|kado|jbnews|kwnews|jejunews|ngonews|cctoday)\.(?:com|co\.kr|net)/i;

/** 베트남 거주·체류 교민 실익 (있으면 지역신문도 예외 허용) */
const EXPAT_IN_VIETNAM_SIGNAL =
  /호치민|사이공|HCMC|TP\.HCM|교민|한인회|한인\s*사회|송금|비자|체류|거주증|생활비|임대료|푸미흥|7군|1군|다낭\s*거주|하노이\s*거주|베트남\s*거주|베트남\s*체류/i;

/** 국내 시·도·군 행정·관광 헤드라인 (경주시, ○○도,) */
const KOREA_LOCAL_GOV_HEADLINE =
  /(?:^|[,(]\s*)(?:[가-힣]{2,5}(?:시|군|도))(?:[^\w가-힣]|,|·|\s)/;

/** 베트남→한국 지역 유치·관광 (교민 포털 범위 밖) */
const VIETNAM_INBOUND_TO_KOREA =
  /베트남.{0,48}(?:유치|인센티|관광(?:시장|객)?|단체|MICE|방문|기업\s*유치)|(?:유치|인센티|관광(?:시장)?|단체\s*유치).{0,48}베트남/i;

function textForMatch(title: string, description: string): string {
  const stripped = title
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .trim();
  return `${stripped} ${description}`.replace(/\s+/g, " ").trim();
}

function publisherFromTitle(title: string): string {
  const m = title.match(/\s*-\s*([가-힣·]+(?:도민일보|시민신문|일보))\s*\)?\s*$/);
  return m?.[1]?.trim() ?? "";
}

export function isRegionalKoreaNewsSource(
  sourceName?: string,
  link?: string,
  title?: string
): boolean {
  const fromTitle = title ? publisherFromTitle(title) : "";
  const name = `${sourceName ?? ""} ${fromTitle}`.trim();
  if (name && REGIONAL_KOREA_NEWS_SOURCE_NAME.test(name)) return true;

  if (!link?.startsWith("http")) return false;
  try {
    const host = new URL(link).hostname.toLowerCase().replace(/^www\.|^m\./, "");
    return REGIONAL_KOREA_NEWS_HOST.test(host);
  } catch {
    return false;
  }
}

/** 한국 지역신문·지자체 유치 뉴스 — 호치민 교민과 무관 */
export function isOffTopicRegionalKoreaNews(
  title: string,
  description = "",
  meta?: { sourceName?: string; link?: string }
): boolean {
  const text = textForMatch(title, description);
  if (!text) return false;

  if (EXPAT_IN_VIETNAM_SIGNAL.test(text)) return false;

  if (
    isRegionalKoreaNewsSource(meta?.sourceName, meta?.link, title)
  ) {
    return true;
  }

  if (
    KOREA_LOCAL_GOV_HEADLINE.test(title) &&
    VIETNAM_INBOUND_TO_KOREA.test(text)
  ) {
    return true;
  }

  return false;
}
