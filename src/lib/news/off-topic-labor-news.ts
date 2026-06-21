/** 이주·현장 노동자 인권·노무 뉴스 — 호치민 교민 포털 범위 밖 */

export const OFF_TOPIC_LABOR_NEWS_PATTERN =
  /이주\s*노동자|이주노동자|노동자|người\s*lao\s*động|lao\s*động\s*di\s*cư/i;

export function isOffTopicLaborNews(title: string, description = ""): boolean {
  const text = `${title} ${description}`.replace(/\s+/g, " ").trim();
  if (!text) return false;
  return OFF_TOPIC_LABOR_NEWS_PATTERN.test(text);
}
