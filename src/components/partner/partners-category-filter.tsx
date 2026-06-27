import Link from "next/link";
import type { ReactNode } from "react";
import type { PartnerCategory } from "@/generated/prisma/client";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";

const categories = Object.keys(PARTNER_CATEGORY_LABELS) as PartnerCategory[];

type PartnersCategoryFilterProps = {
  activeCategory?: PartnerCategory;
};

export function PartnersCategoryFilter({
  activeCategory,
}: PartnersCategoryFilterProps) {
  return (
    <nav
      className="flex flex-wrap gap-2 px-4 pb-3"
      aria-label="업소 카테고리"
    >
      <CategoryPill href="/partners" active={!activeCategory}>
        전체
      </CategoryPill>
      {categories.map((category) => (
        <CategoryPill
          key={category}
          href={`/partners?category=${category}`}
          active={activeCategory === category}
        >
          {PARTNER_CATEGORY_LABELS[category]}
        </CategoryPill>
      ))}
    </nav>
  );
}

function CategoryPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {children}
    </Link>
  );
}
