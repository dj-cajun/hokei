import Link from "next/link";
import { slugifyStoreName } from "@/lib/admin/publish-curated-trade";
import { isValidKakaoLink } from "@/lib/kakao-link";
import { promoStoreTimelineHref } from "@/lib/site-navigation";

type PostCrawlNoticeProps = {
  isCrawl: boolean;
  sectionSlug?: string | null;
};

export function PostCrawlNotice({ isCrawl, sectionSlug }: PostCrawlNoticeProps) {
  if (!isCrawl) return null;

  const promo = sectionSlug === "promo";

  return (
    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      💡 이 글은 카카오톡 단톡방 내용을 AI가 정제해 올린{" "}
      {promo ? "업소 홍보" : "거래·구인"} 정보입니다. 연락·거래 전 내용을 꼭
      확인하세요.
    </p>
  );
}

type PostPromoMetaProps = {
  storeName: string | null;
  kakaoLink: string | null;
  sectionSlug?: string | null;
};

export function PostPromoMeta({
  storeName,
  kakaoLink,
  sectionSlug,
}: PostPromoMetaProps) {
  if (sectionSlug !== "promo") return null;
  if (!storeName && !kakaoLink) return null;

  const storeSlug = storeName ? slugifyStoreName(storeName) : null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {storeName && storeSlug && (
        <Link
          href={promoStoreTimelineHref(storeSlug)}
          className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
        >
          🔥 {storeName} 타임라인
        </Link>
      )}
      {kakaoLink && isValidKakaoLink(kakaoLink) && (
        <a
          href={kakaoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#FEE500] px-2.5 py-1 text-[10px] font-bold text-[#3C1E1E] hover:opacity-90"
        >
          💬 카톡 문의
        </a>
      )}
    </div>
  );
}
