import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NewsListItem } from "@/components/home/news-list-item";
import type { FeedItem } from "@/types/feed";

export function HomeCompactNewsList({ items }: { items: FeedItem[] }) {
  const list = items.slice(0, 3);

  if (list.length === 0) return null;

  return (
    <section className="bg-surface" aria-label="주요 뉴스">
      <div className="flex items-center justify-between border-b border-border-light px-3 py-2">
        <h2 className="text-xs font-bold text-red-600">뉴스</h2>
        <Link href="/news" className="flex items-center text-[10px] text-primary">
          전체 보기 <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        {list.map((item) => (
          <NewsListItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
