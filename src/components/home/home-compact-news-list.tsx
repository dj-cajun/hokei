import { NewsListItem } from "@/components/home/news-list-item";
import type { FeedItem } from "@/types/feed";

export function HomeCompactNewsList({ items }: { items: FeedItem[] }) {
  const list = items.slice(0, 3);

  if (list.length === 0) return null;

  return (
    <section className="bg-white" aria-label="주요 뉴스">
      <div>
        {list.map((item) => (
          <NewsListItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
