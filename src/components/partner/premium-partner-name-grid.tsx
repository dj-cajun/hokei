import Link from "next/link";
import type { PartnerCategory } from "@/generated/prisma/client";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";

export type PremiumPartnerNameItem = {
  id: string;
  slug: string;
  name: string;
  category: PartnerCategory;
};

type PremiumPartnerNameGridProps = {
  stores: PremiumPartnerNameItem[];
};

/** 프리미엄 업소 — 업체명 박스, 가로 4칸 그리드 */
export function PremiumPartnerNameGrid({ stores }: PremiumPartnerNameGridProps) {
  if (stores.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        등록된 프리미엄 업소가 없습니다.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:gap-3">
      {stores.map((store) => (
        <li key={store.id}>
          <Link
            href={`/store/${store.slug}`}
            className="group flex min-h-[5rem] flex-col items-center justify-center rounded-xl border-2 border-amber-300/70 bg-transparent px-2 py-3 text-center shadow-none transition-all hover:border-amber-500 dark:border-amber-500/40 sm:min-h-[5.5rem]"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700/80 dark:hidden">
              Premium
            </span>
            <span className="mt-1 line-clamp-3 text-xs font-bold leading-snug text-foreground group-hover:text-primary dark:mt-0 sm:text-sm">
              {store.name}
            </span>
            <span className="mt-1 line-clamp-1 text-[10px] text-muted-foreground dark:hidden">
              {PARTNER_CATEGORY_LABELS[store.category]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
