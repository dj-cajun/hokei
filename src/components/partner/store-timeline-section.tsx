import Link from "next/link";
import { formatRelativeTime } from "@/lib/format/date";

export type StoreTimelineItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  isCrawl: boolean;
};

type StoreTimelineSectionProps = {
  items: StoreTimelineItem[];
  storeSlug: string;
};

export function StoreTimelineSection({
  items,
  storeSlug,
}: StoreTimelineSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <h2 className="text-sm font-bold text-foreground">소식 · 타임라인</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/posts/${item.id}`}
              className="block rounded-xl border border-border-light bg-card px-3 py-3 shadow-sm transition-colors hover:bg-card-hover"
            >
              <p className="text-sm font-semibold leading-snug text-foreground">
                {item.title}
              </p>
              {item.summary ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              ) : null}
              <p className="mt-2 text-[10px] text-muted-foreground">
                {formatRelativeTime(item.publishedAt)}
                {item.isCrawl ? " · AI 정제" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {items.length >= 3 ? (
        <Link
          href={`/promo/timeline/${storeSlug}`}
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          전체 아카이브 보기 →
        </Link>
      ) : null}
    </section>
  );
}
