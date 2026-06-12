import type { FeedItem } from "@/types/feed";

export type NewsDateGroup = {
  dateLabel: string;
  items: FeedItem[];
};

/** 같은 수집일(호치민)끼리 묶기 — 페이지 내 그룹 헤더용 */
export function groupNewsByIngestDate(items: FeedItem[]): NewsDateGroup[] {
  const groups: NewsDateGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.dateLabel === item.dateLabel) {
      last.items.push(item);
    } else {
      groups.push({ dateLabel: item.dateLabel, items: [item] });
    }
  }
  return groups;
}
