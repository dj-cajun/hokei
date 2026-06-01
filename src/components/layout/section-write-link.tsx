import Link from "next/link";
import { getWriteHref, isWritableSection } from "@/lib/write-sections";
import { cn } from "@/lib/utils";

export function SectionWriteLink({
  sectionSlug,
  compact,
}: {
  sectionSlug: string;
  compact?: boolean;
}) {
  if (!isWritableSection(sectionSlug)) return null;

  return (
    <Link
      href={getWriteHref(sectionSlug)}
      className={cn(
        "shrink-0 font-semibold text-[#0f172a]",
        compact
          ? "text-[11px] underline-offset-2 hover:underline"
          : "rounded-sm bg-[#0f172a] px-3 py-1.5 text-xs text-white"
      )}
    >
      글쓰기
    </Link>
  );
}
