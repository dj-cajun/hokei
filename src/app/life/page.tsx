import Link from "next/link";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { LifeDomainFilter } from "@/components/life/life-domain-filter";
import { LifeGuideList } from "@/components/life/life-guide-list";
import type { LifeDomain } from "@/generated/prisma/client";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getLifeGuides } from "@/lib/life/guides";
import { LIFE_WIKI_DOMAIN_ORDER } from "@/lib/life/labels";

export const metadata = {
  title: "생활 가이드 - 호케이",
  description: "의식주 생활 외국어 위키 · 오피셜 교민 자료실",
};

const VALID_DOMAINS = new Set<string>(LIFE_WIKI_DOMAIN_ORDER);

interface PageProps {
  searchParams: Promise<{ domain?: string }>;
}

export default async function LifePage({ searchParams }: PageProps) {
  const { domain: rawDomain } = await searchParams;
  const domain =
    rawDomain && VALID_DOMAINS.has(rawDomain)
      ? (rawDomain as LifeDomain)
      : undefined;

  const items = isDatabaseAvailable()
    ? await getLifeGuides({ domain, excludeStudy: !domain, limit: 100 })
    : [];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-border-light px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-bold">생활 가이드</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                의·식·주 외국어 · 행정·금융 자료
              </p>
            </div>
            <Link
              href="/life/study"
              className="shrink-0 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[10px] font-semibold text-primary"
            >
              📚 베트남어 공부
            </Link>
          </div>
        </header>
        <Suspense fallback={null}>
          <LifeDomainFilter />
        </Suspense>
        <LifeGuideList items={items} />
        <div className="border-t border-border-light px-3 py-3 text-center">
          <Link href="/" className="text-xs text-primary hover:underline">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
