/** 국내 언론 시론·사설 칼럼 — 호치민 교민 실용 뉴스 범위 밖 */

export const OFF_TOPIC_OPINION_NEWS_PATTERN =
  /\[시론\]|【시론】|［시론］|^시론[\s:：|｜-]/u;

export function isOffTopicOpinionNews(title: string, description = ""): boolean {
  const text = `${title} ${description}`.replace(/\s+/g, " ").trim();
  if (!text) return false;
  return OFF_TOPIC_OPINION_NEWS_PATTERN.test(text);
}
