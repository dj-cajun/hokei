import { ExternalLink, Landmark } from "lucide-react";
import { formatOutlinkCtaLabel } from "@/lib/admin/curate-outlink-metadata";

type PostOutlinkCtaProps = {
  sourceUrl: string;
  sourceName?: string | null;
  /** 본문 전문이 함께 있을 때 안내 문구 */
  withFullBody?: boolean;
  className?: string;
};

/** 총영사관·한인회 등 공식 공지 — 원문 바로가기 */
export function PostOutlinkCta({
  sourceUrl,
  sourceName,
  withFullBody = false,
  className,
}: PostOutlinkCtaProps) {
  if (!sourceUrl.startsWith("http")) return null;

  const label = formatOutlinkCtaLabel(sourceName);

  return (
    <div
      className={
        className ??
        "mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
      }
    >
      <p className="text-xs text-muted-foreground">
        {withFullBody
          ? "아래 본문은 원문 공지를 바탕으로 합니다. 최신·세부 내용은 원문에서 확인해 주세요."
          : "이 글은 공식 기관 공지를 요약한 아웃링크입니다. 전체 내용은 원문에서 확인해 주세요."}
      </p>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
      >
        <Landmark className="h-4 w-4 shrink-0" aria-hidden />
        <span>{label}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      </a>
    </div>
  );
}
