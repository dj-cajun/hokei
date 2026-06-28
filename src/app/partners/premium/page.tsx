import type { Metadata } from "next";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { PremiumPartnerNameGrid } from "@/components/partner/premium-partner-name-grid";
import { PartnersCategoryFilter } from "@/components/partner/partners-category-filter";
import { getAdContactEmail } from "@/lib/contact-emails";
import { isDatabaseAvailable } from "@/lib/database-available";
import { listPublishedPremiumPartners } from "@/lib/partner/queries";
import { resolveSiteUrl } from "@/lib/site-url";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "프리미엄 제휴 업소 - 호케이",
  description:
    "호케이 프리미엄 제휴 업소 — 엄선된 한인 맛집·뷰티·클리닉·생활 서비스.",
  alternates: {
    canonical: `${resolveSiteUrl()}/partners/premium`,
  },
  openGraph: {
    title: "프리미엄 제휴 업소 - 호케이",
    description: "호케이 프리미엄 제휴 업소 목록",
    url: `${resolveSiteUrl()}/partners/premium`,
    locale: "ko_KR",
    type: "website",
  },
};

export default async function PremiumPartnersPage() {
  const stores = isDatabaseAvailable()
    ? await listPublishedPremiumPartners()
    : [];

  const adEmail = getAdContactEmail();

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-surface px-4 py-4">
          <Link
            href="/partners"
            className="text-[10px] font-medium text-primary hover:underline"
          >
            ← 전체 제휴 업소
          </Link>
          <h1 className="mt-1 text-lg font-bold">프리미엄 제휴 업소</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            업체명 박스로 한눈에 — 가로 4칸 미리보기
          </p>
        </header>

        <PartnersCategoryFilter activePremium />

        <PremiumPartnerNameGrid stores={stores} />

        <footer className="border-t border-border-light px-4 py-5 text-center">
          <Link
            href="/contact?kind=ads"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            프리미엄 제휴 문의
          </Link>
          <p className="mt-2 text-[11px] text-muted-foreground">{adEmail}</p>
        </footer>
      </div>
    </div>
  );
}
