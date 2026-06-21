/** 베트남·호치민 여행/교민에게 실질 정보가 있는지 */
const VIETNAM_TRAVEL_UTILITY_PATTERN =
  /호치민|사이공|HCMC|다낭|나트랑|푸꾸옥|하노이|베트남\s*(노선|행|출발|도착|직항|여행|관광|입국)|인천\s*[-·~]\s*(호치민|사이공|다낭|나트랑|하노이)|김포\s*[-·~]\s*(호치민|사이공)|ICN|SGN|DAD|HAN|CXR|PQC/i;

const KOREAN_AIRLINE_NAMES =
  /대한항공|아시아나|제주항공|진에어|티웨이|에어부산|파라타항공|이스타항공|에어프레미아/i;

/** 항공사 기업·인사·기념·국내 업계 동향 (교민 실용 정보 아님) */
const AIRLINE_INDUSTRY_NEWS_PATTERN =
  /글로벌\s*인재\s*육성|인재\s*육성|취항\s*\d+\s*주년|개항\s*\d+\s*주년|창립\s*\d+\s*주년|항공\s*업계\s*동향|항공사\s*(?:실적|경영|인사|임명|CEO|사장)|부터\s*.+항공/i;

function countKoreanAirlineMentions(text: string): number {
  const names = [
    "대한항공",
    "아시아나",
    "제주항공",
    "진에어",
    "티웨이",
    "에어부산",
    "파라타항공",
    "이스타항공",
    "에어프레미아",
  ];
  return names.filter((name) => text.includes(name)).length;
}

function textForMatch(title: string, description: string): string {
  const stripped = title
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .trim();
  return `${stripped} ${description}`.replace(/\s+/g, " ").trim();
}

/** 교민·베트남 여행자에게 쓸모 없는 국내 항공사 뉴스 */
export function isOffTopicAirlineIndustryNews(
  title: string,
  description = ""
): boolean {
  const text = textForMatch(title, description);
  if (!text) return false;

  const hasUtility = VIETNAM_TRAVEL_UTILITY_PATTERN.test(text);
  if (hasUtility) return false;

  if (AIRLINE_INDUSTRY_NEWS_PATTERN.test(text) && KOREAN_AIRLINE_NAMES.test(text)) {
    return true;
  }

  if (countKoreanAirlineMentions(text) >= 2 && /항공|취항|인재|주년|프로모션/i.test(text)) {
    return true;
  }

  return false;
}
