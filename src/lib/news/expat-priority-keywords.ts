/** 교민·베트남 거주자가 실제로 찾는 생활·금융 정보 */
export const EXPAT_LIVING_PATTERN =
  /송금|환율|물가|가계부|생활비|임대료|외식|쌀국수|공과금|월세|전세|Grab|환전|ATM|카드\s*수수료/i;

/** 한·베 협력·교류·산업 (게임, IT, 투자 등) */
export const KOREA_VIETNAM_TIES_PATTERN =
  /베트남.{0,48}(한국|협력|투자|교류|파트너)|한국.{0,48}베트남|한·베|한\-베/i;

/** 한국 기업·재벌의 베트남 투자·인프라 (현대차 철도 등) */
export const KOREAN_CORP_VIETNAM_PATTERN =
  /(?:현대|삼성|SK|LG|포스코|롯데|한국).{0,40}베트남|베트남.{0,40}(?:현대|삼성|SK|LG|포스코|롯데)/i;

/** 베트남 항공·운항 실용 정보 (베트남항공 정시운항 등) */
export const VIETNAM_AVIATION_UTIL_PATTERN =
  /베트남항공|vietnam\s*airlines|정시운항|운항\s*지연|노선\s*증편|노선\s*재개/i;

/** 삭제 권장 — 국내 항공사 기업·HR·기념 (off-topic-airline-news와 병행) */
export const EXPAT_LOW_VALUE_AIRLINE_PATTERN =
  /글로벌\s*인재\s*육성|인재\s*육성|취항\s*\d+\s*주년|개항\s*\d+\s*주년|창립\s*\d+\s*주년|부터\s*.+항공/i;

/** 삭제 권장 — 국내 소비 칼럼·연예·범죄 스토리 */
export const EXPAT_LOW_VALUE_GENERAL_PATTERN =
  /\[(하늘길|PC방|주차장|와이파이)\]|위클리\s*시리즈|송혜교|넷플릭스|강간\s*사건|이\s*작가가\s*여행/i;

/** 베트남 지역 키워드 (topic-relevance와 동기화) */
const VIETNAM_LOCAL =
  /베트남|호치민|사이공|HCMC|TP\.HCM|다낭|하노이|나트랑|푸꾸옥/i;

function textForMatch(title: string, description: string): string {
  const stripped = title
    .replace(/^\[[^\]]+\]\s*/u, "")
    .replace(/^VnExpress\s*·\s*/iu, "")
    .trim();
  return `${stripped} ${description}`.replace(/\s+/g, " ").trim();
}

/** 교민 포털에 실질 가치 있는 기사 */
export function matchesExpatPriorityNews(
  title: string,
  description = ""
): boolean {
  const text = textForMatch(title, description);
  if (!VIETNAM_LOCAL.test(text)) return false;

  return (
    EXPAT_LIVING_PATTERN.test(text) ||
    KOREA_VIETNAM_TIES_PATTERN.test(text) ||
    KOREAN_CORP_VIETNAM_PATTERN.test(text) ||
    VIETNAM_AVIATION_UTIL_PATTERN.test(text)
  );
}

export function isExpatLowValueNews(title: string, description = ""): boolean {
  const text = textForMatch(title, description);
  return (
    EXPAT_LOW_VALUE_GENERAL_PATTERN.test(text) ||
    (EXPAT_LOW_VALUE_AIRLINE_PATTERN.test(text) &&
      /대한항공|제주항공|아시아나|진에어|티웨이/.test(text) &&
      !VIETNAM_AVIATION_UTIL_PATTERN.test(text))
  );
}
