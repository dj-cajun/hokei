import Link from "next/link";
import { Flame, Heart } from "lucide-react";
import type { FeedItem } from "@/types/feed";

type PopularPostsStripProps = {
  items: FeedItem[];
  title?: string;
  moreHref?: string;
};

export function PopularPostsStrip({
  items,
  title = "인기글",
  moreHref = "/community",
}: PopularPostsStripProps) {
  const ranked = [...items]
    .sort(
      (a, b) =>
        (b.likes ?? 0) - (a.likes ?? 0) || b.views - a.views
    )
    .slice(0, 5);
  if (ranked.length === 0) return null;

  return (
    <section className="border-b border-gray-100 bg-white px-3 py-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-[#c8102e]">
          <Flame className="h-4 w-4" />
          {title}
        </h2>
        <Link href={moreHref} className="text-[11px] text-gray-500 hover:text-primary">
          더보기
        </Link>
      </div>
      <ol className="space-y-2">
        {ranked.map((item, index) => (
          <li key={item.id}>
            <Link
              href={`/posts/${item.id}`}
              className="flex items-start gap-2 rounded-lg px-1 py-1 hover:bg-gray-50"
            >
              <span className="mt-0.5 w-4 shrink-0 text-center text-xs font-bold text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium leading-snug">
                  {item.title}
                </p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-0.5 text-rose-600">
                    <Heart className="h-3 w-3 fill-rose-500" />
                    {item.likes ?? 0}
                  </span>
                  <span>조회 {item.views}</span>
                  <span>댓글 {item.comments}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
