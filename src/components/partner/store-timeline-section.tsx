import Link from "next/link";
import { PenLine } from "lucide-react";
import { StoreTimelinePostActions } from "@/components/partner/store-timeline-post-actions";
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
  canWriteTimeline?: boolean;
  writeHref?: string;
  canManageTimeline?: boolean;
};

export function StoreTimelineSection({
  items,
  storeSlug,
  canWriteTimeline = false,
  writeHref,
  canManageTimeline = false,
}: StoreTimelineSectionProps) {
  if (items.length === 0 && !canWriteTimeline) return null;

  return (
    <section className="px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">이벤트 · 타임라인</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            진행 중인 이벤트와 업소 소식
          </p>
        </div>
        {canWriteTimeline && writeHref ? (
          <Link
            href={writeHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden />
            글쓰기
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border-light bg-card px-4 py-6 text-center text-xs text-muted-foreground">
          아직 등록된 이벤트가 없습니다.
          {canWriteTimeline ? " 글쓰기로 첫 소식을 올려 보세요." : null}
        </p>
      ) : (
        <ul className="relative mt-4 ml-3 space-y-3 border-l-2 border-primary/25 py-1 pl-5">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span
                className="absolute -left-[1.4rem] top-4 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface"
                aria-hidden
              />
              <div className="overflow-hidden rounded-xl border border-border-light bg-card shadow-sm">
                <Link
                  href={`/posts/${item.id}`}
                  className="block transition-colors hover:bg-card-hover"
                >
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail}
                      alt=""
                      className="block h-auto max-h-64 w-full bg-muted/20 object-contain object-center"
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
                {canManageTimeline ? (
                  <StoreTimelinePostActions
                    postId={item.id}
                    redirectHref={`/store/${storeSlug}`}
                    mode="delete"
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManageTimeline || items.length >= 3 ? (
        <Link
          href={`/promo/timeline/${storeSlug}`}
          className="mt-4 inline-block text-xs font-medium text-primary hover:underline"
        >
          {canManageTimeline ? "타임라인 관리 · 전체 보기 →" : "전체 이벤트 보기 →"}
        </Link>
      ) : null}
    </section>
  );
}
