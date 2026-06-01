import type { PostTopic } from "@/generated/prisma/client";
/** 한국·교민 연관 */
const KOREA_RELATED_PATTERN =
  /한국|한국인|한·|한\-|대한항공|아시아나|진에어|제주항공|티웨이|에어부산|파라타항공|하나투어|모두투어|마이리얼트립|교민|교포|재외동포|Korean|Korea|ROK|Seoul|Incheon|김포|인천공항|서울|부산|K-?culture|한류|Hàn Quốc|Hàn quốc|người Hàn|South Korean/i;

/** 여행·관광 */
const TRAVEL_PATTERN =
  /여행|관광|투어|항공|airline|travel|tour|tourism|MICE|호텔|hotel|resort|크루즈|cruise/i;

/** 비자·정책·체류 */
const POLICY_PATTERN =
  /비자|visa|거주|이민|immigration|residency|체류|입국|영주|work permit|노동|labor|외국인|foreign|expat|amnesty|사면|정책|policy|quarantine|세관|customs|규정|법률|law|permit/i;

/** 수집 시 붙는 `[한국]`·`VnExpress ·` 접두사 제거 후 본문 판별 */
export function normalizeTextForTopicMatch(title: string, description = ""): string {
  const stripped = title
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .trim();
  return `${stripped} ${description}`.trim();
}

export function isKoreaRelatedNews(title: string, description = ""): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (!text) return false;
  return KOREA_RELATED_PATTERN.test(text);
}

function matchesTravelTopic(title: string, description: string): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  return isKoreaRelatedNews(title, description) && TRAVEL_PATTERN.test(text);
}

function matchesPolicyTopic(title: string, description: string): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (!POLICY_PATTERN.test(text)) return false;
  return (
    isKoreaRelatedNews(title, description) ||
    /외국인|foreign|expat|immigrant|교민|resident|입국자/i.test(text)
  );
}

function matchesKoreaTopic(title: string, description: string): boolean {
  return isKoreaRelatedNews(title, description);
}

/** 토픽·VnExpress 공통 — 제목·요약이 해당 주제와 맞는지 */
export function passesTopicRelevanceFilter(
  topic: PostTopic,
  title: string,
  description = "",
  meta?: { link?: string; sourceName?: string }
): boolean {
  void meta;
  switch (topic) {
    case "KOREA":
      return matchesKoreaTopic(title, description);
    case "TRAVEL":
    case "TOURIST":
      return matchesTravelTopic(title, description);
    case "VIETNAM_POLICY":
      return matchesPolicyTopic(title, description);
    default:
      return true;
  }
}

/** @deprecated passesTopicRelevanceFilter 사용 */
export function passesTravelKoreaFilter(
  topic: string,
  title: string,
  description = ""
): boolean {
  return passesTopicRelevanceFilter(
    topic as PostTopic,
    title,
    description
  );
}
