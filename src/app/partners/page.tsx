import type { Metadata } from "next";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { PartnerCard } from "@/components/partner/partner-card";
import { PartnersCategoryFilter } from "@/components/partner/partners-category-filter";
import { getAdContactEmail } from "@/lib/contact-emails";
import { isDatabaseAvailable } from "@/lib/database-available";
import { listPublishedPartners } from "@/lib/partner/queries";
import { partnerCategorySchema } from "@/lib/partner/validate";
import { resolveSiteUrl } from "@/lib/site-url";
import type { PartnerCategory } from "@/generated/prisma/client";

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

function parseCategoryParam(raw?: string): PartnerCategory | undefined {
  if (!raw?.trim()) return undefined;
  const parsed = partnerCategorySchema.safeParse(raw.trim());
  return parsed.success ? parsed.data : undefined;
}

export const metadata: Metadata = {
  title: "호케이 제휴 업소",
  description:
    "호치민 한인 제휴 업소 — 맛집·뷰티·클리닉·생활 서비스를 한곳에서 확인하세요.",
  alternates: {
    canonical: `${resolveSiteUrl()}/partners`,
  },
  openGraph: {
    title: "호케이 제휴 업소",
    description: "호치민 한인 제휴 업소 목록",
    url: `${resolveSiteUrl()}/partners`,
    locale: "ko_KR",
    type: "website",
  },
};

export default async function PartnersPage({ searchParams }: PageProps) {
  const { category: categoryParam } = await searchParams;
  const category = parseCategoryParam(categoryParam);

  const stores = isDatabaseAvailable()
    ? await listPublishedPartners({ limit: 48, category })
    : [];

  const adEmail = getAdContactEmail();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-border-light px-4 py-4">
          <h1 className="text-lg font-bold">호케이 제휴 업소</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            제휴 맛집·뷰티·클리닉·생활 서비스
          </p>
        </header>

        <PartnersCategoryFilter activeCategory={category} />

        {stores.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {stores.map((store) => (
              <li key={store.id}>
                <PartnerCard store={store} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {category ? "해당 카테고리 업소가 없습니다" : "준비 중"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              제휴 업소가 곧 오픈됩니다. 배너·업소 홍보 문의를 환영합니다.
            </p>
          </div>
        )}

        <footer className="border-t border-border-light px-4 py-5 text-center">
          <Link
            href="/contact?kind=ads"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            광고·제휴 문의
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground">{adEmail}</p>
        </footer>
      </div>
    </div>
  );
}
