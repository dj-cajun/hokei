import Link from "next/link";
import { slugifyStoreName } from "@/lib/admin/publish-curated-trade";
import { buildCrawlContactChips } from "@/lib/crawl-contact";
import { promoStoreTimelineHref } from "@/lib/site-navigation";

type PostCrawlNoticeProps = {
  isCrawl: boolean;
  sectionSlug?: string | null;
};

export function PostCrawlNotice({ isCrawl, sectionSlug }: PostCrawlNoticeProps) {
  if (!isCrawl) return null;

  const promo = sectionSlug === "promo";
  const community = sectionSlug === "community";
  const label = promo
    ? "업소 홍보"
    : community
      ? "생활 Q&A·제보"
      : "거래·구인";

  return (
    <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      💡 이 글은 카카오톡 단톡방 내용을 AI가 정제해 올린 {label} 정보입니다.
      연락·거래 전 내용을 꼭 확인하세요.
    </p>
  );
}

type PostCrawlContactBarProps = {
  isCrawl: boolean;
  storeName: string | null;
  kakaoLink: string | null;
  content?: string | null;
  sourceName?: string | null;
  sectionSlug?: string | null;
};

const CHIP_CLASS: Record<
  ReturnType<typeof buildCrawlContactChips>[number]["kind"],
  string
> = {
  kakao: "bg-[#FEE500] text-[#3C1E1E] hover:opacity-90",
  tel: "bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  zalo: "bg-sky-50 text-sky-800 hover:bg-sky-100",
  text: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

export function PostCrawlContactBar({
  isCrawl,
  storeName,
  kakaoLink,
  content,
  sourceName,
  sectionSlug,
}: PostCrawlContactBarProps) {
  if (!isCrawl) return null;

  const chips = buildCrawlContactChips({ kakaoLink, content, sourceName });
  const storeSlug = storeName ? slugifyStoreName(storeName) : null;
  const showTimeline = sectionSlug === "promo" && storeName && storeSlug;

  if (!showTimeline && chips.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {showTimeline && (
        <Link
          href={promoStoreTimelineHref(storeSlug!)}
          className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100"
        >
          🔥 {storeName} 타임라인
        </Link>
      )}
      {chips.map((chip) =>
        chip.href ? (
          <a
            key={`${chip.kind}:${chip.value}`}
            href={chip.href}
            target={chip.kind === "tel" ? undefined : "_blank"}
            rel={chip.kind === "tel" ? undefined : "noopener noreferrer"}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${CHIP_CLASS[chip.kind]}`}
          >
            {chip.kind === "kakao" && "💬 "}
            {chip.kind === "zalo" && "💙 "}
            {chip.kind === "tel" && "📞 "}
            {chip.label}
          </a>
        ) : (
          <span
            key={`${chip.kind}:${chip.value}`}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${CHIP_CLASS[chip.kind]}`}
            title={chip.value}
          >
            {chip.label}
          </span>
        )
      )}
    </div>
  );
}

/** @deprecated PostCrawlContactBar 사용 */
export const PostPromoMeta = PostCrawlContactBar;
