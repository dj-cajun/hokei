import Link from "next/link";
import { formatRelativeTime } from "@/lib/format/date";

export type StoreTimelineItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: Date;
  thumbnail: string | null;
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
      <h2 className="text-sm font-bold text-foreground">이벤트 · 타임라인</h2>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        진행 중인 이벤트와 업소 소식
      </p>

      <ul className="relative mt-4 ml-3 space-y-3 border-l-2 border-primary/25 py-1 pl-5">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span
              className="absolute -left-[1.4rem] top-4 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface"
              aria-hidden
            />
            <Link
              href={`/posts/${item.id}`}
              className="block overflow-hidden rounded-xl border border-border-light bg-card shadow-sm transition-colors hover:bg-card-hover"
            >
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.thumbnail}
                  alt=""
                  className="aspect-[2.2/1] w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="px-3 py-3">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  {item.title}
                </p>
                {item.summary ? (
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                    {item.summary}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] text-muted-foreground">
                  {formatRelativeTime(item.publishedAt)}
                  {item.isCrawl ? " · AI 정제" : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {items.length >= 3 ? (
        <Link
          href={`/promo/timeline/${storeSlug}`}
          className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
        >
          전체 이벤트 보기 →
        </Link>
      ) : null}
    </section>
  );
}
