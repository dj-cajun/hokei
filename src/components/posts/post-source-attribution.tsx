import { ExternalLink } from "lucide-react";
import { formatPostSourceAttribution } from "@/lib/news/source-display";

type PostSourceAttributionProps = {
  sourceName?: string | null;
  sourceUrl: string;
  className?: string;
};

/** 썸네일 바로 아래 출처 */
export function PostSourceAttribution({
  sourceName,
  sourceUrl,
  className,
}: PostSourceAttributionProps) {
  if (!sourceUrl.startsWith("http")) return null;

  const label = formatPostSourceAttribution(sourceName) ?? "원문";

  return (
    <p
      className={
        className ??
        "mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground"
      }
    >
      <span>출처</span>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-full items-center gap-0.5 font-medium text-primary hover:underline"
      >
        <span className="truncate">{label}</span>
        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
      </a>
    </p>
  );
}
