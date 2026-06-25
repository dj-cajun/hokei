/** Gemini 카톡 큐레이션 시스템·유저 프롬프트 (호치민 교민 단톡 실전 양식) */

export const CURATE_ANALYZE_SYSTEM = `당신은 호케이(Hokei) 호치민 교민 포털의 카톡 큐레이션 엔진입니다.
카카오톡 대화보내기(.txt) 원문에서 게시 가능한 항목만 JSON으로 추출합니다.
잡담·이모티·단순 인사·"ㅋㅋ"·동의만 있는 줄은 무시하세요.
반드시 유효한 JSON만 출력하세요.`;

export function buildCurateAnalyzePrompt(
  rawText: string,
  meta?: { part: number; total: number }
): string {
  const segment =
    meta && meta.total > 1
      ? `\n(전체 대화록 ${meta.part}/${meta.total}번째 구간 — 이 구간의 === [시간] === 단락만 처리)\n`
      : "";

  return `호치민 한인 단톡방 대화보내기 원문입니다. **=== [시간] ===** 마다 1개 메시지(시간 단락)입니다.
${segment}
**원칙:** 시간 단락 1개에서 게시물 1건을 기본으로 추출. 같은 업체·같은 매물이 여러 단락에 이어지면 하나로 합치되, 서로 다른 매물·다른 날 홍보는 분리.

=== 원문 시작 ===
${rawText}
=== 원문 끝 ===

## 5대 섹션 분류 (contentType)

| contentType | 대상 | 예시 키워드 |
| VIETNAMESE_STUDY | 교민 베트남어 공부 | 매일 베트남어, 뉴스로 배우는 베트남어, 베트남단어 자동암기, 성조 |
| REAL_ESTATE | 부동산·임대·양도 | 부동산, 아파트, 스튜디오, 임대, 만동, Q2, 빈컴, 타오디엔 |
| CLASSIFIED | 중고 거래 | 판매합니다, 팝니다, 삽니다, 오토바이, 야마하, 냉장고 |
| JOBS | 구인·구직·비즈니스 | 구인, 구직, 통역, B2B, 월급, 채용 |
| PROMO | 한인 업소 홍보 | 메뉴, 특가, 배달, 오픈, JOY마켓, 짚불태백, 반찬 |
| UNKNOWN | 위에 해당 없음 | |

## 카테고리 slug (categorySlug)

- REAL_ESTATE: real-estate-tenant-seeking | real-estate-landlord-seeking
- CLASSIFIED: classifieds-buying | classifieds-selling
- JOBS: jobs-hiring | jobs-job-seeking
- PROMO: promo-store-hungry | promo-store-inconvenient

## 메타 필드 (가능하면 반드시 추출)

- region: 1군·2군·7군·푸미흥·타오디엔·빈컴 등
- priceVnd: 숫자만 (예: 25000000) — 만동·백만동 문구 파싱
- listingIntent: RENT | SELL | BUY | HIRE | SEEK | PROMO
- itemKind: APARTMENT | STUDIO | MOTORCYCLE | CAR | FOOD | SERVICE 등
- contactPhone: 0으로 시작하는 베트남·한국 번호
- contactKakaoId: 카톡 ID (예: myhomesaigon1, bigseung1, haoxiang4545)
- kakaoLink: open.kakao.com URL
- storeName: PROMO 필수 — JOY마켓, 짚불태백, 막둥이네짬뽕 등 상호
- senderName: 발신자 (예: 모아 홈즈 부동산, 대박호치민)
- messageAt: ISO8601 추정 (단락 시간 라벨 기준)

## 제목·본문 양식

**부동산 예:**
원문: "Q2 타오디엔 • 스튜디오 • 풀옵션 • 53m² • 저층 • 2500만동"
→ title: "[2군 타오디엔] Q2 스튜디오 풀옵션 임대 (저층, 53m²)"
→ categorySlug: real-estate-tenant-seeking
→ listingIntent: RENT, itemKind: STUDIO, region: 2군, priceVnd: 25000000

**중고 예:**
원문: "2011년식 야마하 루비아스 판매... 8,000,000... 7군 푸미흥"
→ title: "[7군 푸미흥] 2011년식 야마하 루비아스 오토바이 판매"
→ categorySlug: classifieds-selling
→ listingIntent: SELL, itemKind: MOTORCYCLE

**홍보 예:**
원문: 짚불태백 점심 특가 / JOY마켓 행사
→ storeName: 짚불태백 (상호만, "점심 특가"는 제목에)
→ title: "[짚불태백] 점심 특가 안내" (날짜·메뉴 반영)
→ 각 다른 홍보 단락은 **별도 items** (같은 가게라도 날짜·메뉴 다르면 분리)

**베트남어 공부 예:**
→ title: "[매일 베트남어] …" 접두
→ vnText: 베트남어 원문 한 줄
→ slugSuggestion: 영문 소문자 하이픈

body는 마크다운. 연락처·가격·위치·조건을 bullet로 정리(5줄 이내). 원문에 없는 정보는 지어내지 마세요.
**이 구간에서 게시 가능한 항목은 최대 12건까지만 items에 넣으세요.** JSON은 간결하게, notes는 필요할 때만.

## JSON 출력

{
  "items": [
    {
      "contentType": "REAL_ESTATE",
      "title": "...",
      "body": "...",
      "summary": "한 줄",
      "categorySlug": "real-estate-apartment-rent",
      "region": "2군",
      "priceVnd": 25000000,
      "listingIntent": "RENT",
      "itemKind": "STUDIO",
      "contactPhone": "0901891049",
      "contactKakaoId": "myhomesaigon1",
      "senderName": "모아 홈즈 부동산",
      "messageAt": "2026-05-04T17:08:00+07:00",
      "sourceLabel": "카톡 단톡방"
    }
  ],
  "notes": "선택"
}`;
}
