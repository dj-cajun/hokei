import Link from "next/link";
import type { LifeGuideListItem } from "@/lib/life/guides";
import { ChevronRight } from "lucide-react";

type HomeLifeStripProps = {
  featuredLife: LifeGuideListItem | null;
};

export function HomeLifeStrip({ featuredLife }: HomeLifeStripProps) {
  return (
    <section className="border-b border-border-light bg-surface px-3 py-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-foreground">생활 · 베트남어</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/life/study"
            className="flex items-center text-[10px] text-primary"
          >
            공부 더보기 <ChevronRight className="h-3 w-3" />
          </Link>
          <Link
            href="/life"
            className="flex items-center text-[10px] text-muted-foreground"
          >
            위키 <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {featuredLife ? (
        <Link
          href={
            featuredLife.domain === "STUDY"
              ? `/life/${featuredLife.slug}`
              : `/life/${featuredLife.slug}`
          }
          className="mt-2 block rounded-xl bg-amber-50 px-3 py-2.5 dark:bg-amber-950/30"
        >
          <p className="text-[10px] font-medium text-muted-foreground">
            {featuredLife.domain === "STUDY" ? "오늘의 베트남어" : "오늘의 생활 외국어"}
          </p>
          <p className="text-sm font-semibold">{featuredLife.title}</p>
          {featuredLife.vnText && (
            <p className="mt-1 text-base font-bold text-primary">
              {featuredLife.vnText}
            </p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground">
            탭하면 발음·큰글씨 모드 →
          </p>
        </Link>
      ) : (
        <Link
          href="/life/study"
          className="mt-2 block rounded-xl border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground"
        >
          베트남어 공부 표현이 곧 올라옵니다
        </Link>
      )}
    </section>
  );
}
