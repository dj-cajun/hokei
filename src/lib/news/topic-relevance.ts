import type { PostTopic } from "@/generated/prisma/client";
import { isKoreanPublisherArticleLink } from "@/lib/news/korean-news-publishers";
import { matchesExpatPriorityNews } from "@/lib/news/expat-priority-keywords";
import { isOffTopicAirlineIndustryNews } from "@/lib/news/off-topic-airline-news";
import { isOffTopicLaborNews } from "@/lib/news/off-topic-labor-news";
import { isOffTopicOpinionNews } from "@/lib/news/off-topic-opinion-news";
import { isOffTopicRegionalKoreaNews } from "@/lib/news/off-topic-regional-korea-news";
import { isVnExpressArticle } from "@/lib/news/vnexpress";

/** 호치민·베트남 현지 연관 (수집 대상 지역) */
const VIETNAM_LOCAL_PATTERN =
  /베트남|호치민|사이공|HCMC|TP\.HCM|Ho Chi Minh|Saigon|Hồ Chí Minh|푸미흥|Thủ Đức|다낭|하노이|나트랑|푸꾸옥|달랏|하롱|7군|1군|VnExpress|vnexpress|익스프레스|Báo|Tuổi Trẻ|tuoitre|Việt Nam|Việt nam/i;

/** 현지어 제목·요약 (한국인·투자·안전) */
const VIETNAMESE_TOPIC_PATTERN =
  /Người Hàn|người Hàn|Hàn Quốc|Đầu tư|đầu tư|An ninh|an ninh|an toàn|đầu tư nước ngoài/i;

/** 한국·교민 연관 */
const KOREA_RELATED_PATTERN =
  /한국|한국인|한·|한\-|대한항공|아시아나|진에어|제주항공|티웨이|에어부산|파라타항공|하나투어|모두투어|마이리얼트립|교민|교포|재외동포|Korean|Korea|ROK|K-?culture|한류|Hàn Quốc|Hàn quốc|người Hàn|South Korean/i;

/** 여행·관광 */
const TRAVEL_PATTERN =
  /여행|관광|투어|항공|airline|travel|tour|tourism|MICE|호텔|hotel|resort|크루즈|cruise|여행지|입국|환승/i;

/** 여행객 — 현지 관광·안전·입국 (한국인 키워드 없어도 허용) */
const TOURIST_INFO_PATTERN =
  /관광|여행지|명소|입국|여행주의|관광객|휴가|리조트|미슐랭|야시장|환전|eSIM|택시|grab|안전/i;

/** 비자·정책·체류 */
const POLICY_PATTERN =
  /비자|visa|거주|이민|immigration|residency|체류|입국|영주|work permit|노동|labor|외국인|foreign|expat|amnesty|사면|정책|policy|quarantine|세관|customs|규정|법률|law|permit|E-?visa|TTDH|노동허가|거주증|체류연장|임시체류/i;

/** 베트남 무관 미국·기타 지역 한인 뉴스 (보스턴컵·뉴저지 등) */
const OFF_TOPIC_DIASPORA_PATTERN =
  /뉴저지|보스턴컵|보스턴[^민]|LA 한인|캀이프타운|뉴욕 한인|실리콘밸리|토론토|시카고 한인|조지아 한인/i;

/** 국내 언론 위클리 칼럼·소비자 행사 묶음 (베트남 교민과 무관) */
const OFF_TOPIC_WEEKLY_COLUMN_PATTERN =
  /\[(하늘길|PC방|주차장|와이파이|알림장|가전&?쿡커)\]|위클리\s*시리즈|슬기로운\s*시간/i;

function isOffTopicDomesticRoundup(title: string, description = ""): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (OFF_TOPIC_WEEKLY_COLUMN_PATTERN.test(text)) return true;

  const airlinePromo =
    /국제선\s*프로모션|여름휴가\s*국제선|여름\s*성수기\s*국제선|할인코드/i.test(
      text
    );
  const multiAirline =
    [/(?:^|[^가-힣])파라타/i, /티웨이/i, /진에어/i, /제주항공/i].filter((p) =>
      p.test(text)
    ).length >= 2;

  if (
    airlinePromo &&
    multiAirline &&
    !/호치민|사이공|HCMC|교민|한국인\s*여행|베트남\s*여행/i.test(text)
  ) {
    return true;
  }

  return false;
}

/** 수집 시 붙는 `[한국]`·`VnExpress ·` 접두사 제거 후 본문 판별 */
export function normalizeTextForTopicMatch(title: string, description = ""): string {
  const stripped = title
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .trim();
  return `${stripped} ${description}`.trim();
}

function isTrustedKoreanVietnamSource(sourceName?: string, link?: string): boolean {
  if (sourceName && /insidevina|인사이드비나|vietnam\.vn|laodong|라오동/i.test(sourceName)) {
    return true;
  }
  if (link && /insidevina\.com|vietnam\.vn|ko\.laodong\.vn/i.test(link)) return true;
  return false;
}

/** 호치민·베트남 현지 관련 기사인지 */
export function isVietnamLocalRelevant(
  title: string,
  description = "",
  meta?: { sourceName?: string; link?: string }
): boolean {
  const link = meta?.link ?? "";
  const sourceName = meta?.sourceName ?? "";

  // 피드 설정 sourceName(VnExpress)만으로 우회하지 않음 — 실제 URL·제목 기준
  if (isVnExpressArticle(link, title, sourceName)) return true;
  if (isTrustedKoreanVietnamSource(sourceName, link)) return true;

  const text = normalizeTextForTopicMatch(title, description);
  if (!text) return false;

  if (
    OFF_TOPIC_DIASPORA_PATTERN.test(text) &&
    !VIETNAM_LOCAL_PATTERN.test(text)
  ) {
    return false;
  }

  if (VIETNAM_LOCAL_PATTERN.test(text) || VIETNAMESE_TOPIC_PATTERN.test(text)) {
    return true;
  }

  // 네이버·국내 매체 원문 링크 — 검색어가 베트남 맥락이어도 제목에 지역·한인 힌트 필요
  if (isKoreanPublisherArticleLink(link)) {
    return /한인|교민|교포|한국인|호치민|사이공|베트남|하노이|다낭|나트랑|푸미흥|비자|체류|여행|관광/i.test(
      text
    );
  }

  return false;
}

export function isKoreaRelatedNews(title: string, description = ""): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (!text) return false;
  return KOREA_RELATED_PATTERN.test(text);
}

/** 한국인·교민이 베트남을 방문·이동할 때 검색하는 뉴스 */
function matchesTravelTopic(title: string, description: string): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (!isKoreaRelatedNews(title, description) || !TRAVEL_PATTERN.test(text)) {
    return false;
  }
  return /호치민|사이공|HCMC|다낭|나트랑|푸꾸옥|하노이|베트남|한국인\s*여행|교민.*여행/i.test(
    text
  );
}

/** 베트남 방문 여행객 — 현지 관광·안전·입국 */
function matchesTouristTopic(title: string, description: string): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  return (
    TOURIST_INFO_PATTERN.test(text) &&
    /호치민|사이공|다낭|나트랑|푸꾸옥|베트남/i.test(text)
  );
}

function matchesPolicyTopic(title: string, description: string): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (VIETNAMESE_TOPIC_PATTERN.test(text) && /An ninh|an ninh|visa|nhập cảnh/i.test(text)) {
    return true;
  }
  if (!POLICY_PATTERN.test(text)) return false;
  return (
    isKoreaRelatedNews(title, description) ||
    /외국인|foreign|expat|immigrant|교민|resident|입국자|호치민|베트남|사이공/i.test(
      text
    )
  );
}

function matchesKoreaTopic(title: string, description: string): boolean {
  const text = normalizeTextForTopicMatch(title, description);
  if (VIETNAMESE_TOPIC_PATTERN.test(text) && VIETNAM_LOCAL_PATTERN.test(text)) {
    return true;
  }
  return (
    /한인|교민|교포|한국인|한인회|한국\s*기업/i.test(text) &&
    /호치민|사이공|베트남|하노이|다낭|나트랑|푸미흥|7군|1군/i.test(text)
  );
}

/** 토픽·VnExpress 공통 — 제목·요약이 해당 주제와 맞는지 */
export function passesTopicRelevanceFilter(
  topic: PostTopic,
  title: string,
  description = "",
  meta?: { link?: string; sourceName?: string }
): boolean {
  if (isOffTopicLaborNews(title, description)) {
    return false;
  }

  if (isOffTopicOpinionNews(title, description)) {
    return false;
  }

  if (isOffTopicRegionalKoreaNews(title, description, meta)) {
    return false;
  }

  // 인사이드비나·Vietnam.vn·라오동 — 베트남 현지 한국어 매체는 교민 실용 정보 우선
  if (isTrustedKoreanVietnamSource(meta?.sourceName, meta?.link)) {
    return true;
  }

  // 송금·물가·베트남항공 운항·한국 기업 베트남 투자 등 (항공사 HR·기념 필터보다 우선)
  if (matchesExpatPriorityNews(title, description)) {
    return true;
  }

  if (isOffTopicAirlineIndustryNews(title, description)) {
    return false;
  }

  if (isOffTopicDomesticRoundup(title, description)) {
    return false;
  }

  if (!isVietnamLocalRelevant(title, description, meta)) {
    return false;
  }

  switch (topic) {
    case "KOREA":
      return matchesKoreaTopic(title, description);
    case "TRAVEL":
      return matchesTravelTopic(title, description);
    case "TOURIST":
      return matchesTouristTopic(title, description);
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
