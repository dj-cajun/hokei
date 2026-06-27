import type { Metadata } from "next";
import Link from "next/link";
import { PartnerCard } from "@/components/partner/partner-card";
import { AdInquiryLink } from "@/components/contact/ad-inquiry-link";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getAdContactEmail } from "@/lib/contact-emails";
import { listPublishedPartners } from "@/lib/partner/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "호케이 제휴 업소 | 호케이",
  description: "호치민 한인 제휴 맛집·미용·병원·생활서비스를 한곳에서 확인하세요.",
};

export default async function PartnersPage() {
  const stores = isDatabaseAvailable()
    ? await listPublishedPartners()
    : [];

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-3 py-4 lg:max-w-2xl lg:px-4">
      <header className="mb-4">
        <h1 className="text-lg font-bold">호케이 제휴 업소</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          카톡·전화·지도로 바로 연결되는 한인 업소 페이지
        </p>
      </header>

      {stores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-light bg-surface px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">제휴 업소를 준비 중입니다.</p>
          <div className="mt-4">
            <AdInquiryLink
              email={getAdContactEmail()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            />
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {stores.map((store) => (
            <li key={store.id}>
              <PartnerCard store={store} />
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-8 border-t border-border-light pt-4 text-center">
        <p className="text-xs text-muted-foreground">제휴·배너 문의</p>
        <div className="mt-2">
          <AdInquiryLink
            email={getAdContactEmail()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          />
        </div>
        <Link
          href="/promo"
          className="mt-3 inline-block text-[11px] text-muted-foreground hover:text-primary hover:underline"
        >
          찐 생활정보(업소 홍보) 보기
        </Link>
      </footer>
    </div>
  );
}
