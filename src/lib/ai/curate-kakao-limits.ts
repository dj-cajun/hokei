/** AI 카톡 큐레이션 입력·분석 한도 */
export const KAKAO_RAW_MIN_LENGTH = 10;
/** API·UI 공통 — 카톡 .txt 전체 붙여넣기 허용 (60만자) */
export const KAKAO_RAW_MAX_LENGTH = 600_000;
/** Gemini 1회 프롬프트 구간 (10만자) */
export const KAKAO_ANALYZE_CHUNK_SIZE = 100_000;
/** UI·클라이언트 순차 분석 구간 (4만자) — 요청당 Gemini 호출 24회 이하 */
export const KAKAO_ANALYZE_CLIENT_BATCH_SIZE = 40_000;
/** 요청 1회당 Gemini API 호출 상한 */
export const KAKAO_ANALYZE_MAX_GEMINI_CALLS = 24;
/** Gemini 1회 호출당 시간 단락(메시지) 상한 — JSON 잘림 방지 */
export const KAKAO_GEMINI_MAX_BLOCKS_PER_CALL = 30;
/** 분석·일괄 발행 최대 항목 수 */
export const KAKAO_MAX_EXTRACTED_ITEMS = 50;
