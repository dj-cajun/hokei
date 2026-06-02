import { WriteForm } from "@/components/write/write-form";
import { getWritableCategories } from "@/lib/categories";
import { isWritableSection, WRITE_SECTION_META } from "@/lib/write-sections";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 - 호케이 Hokei",
  description: "구인, 부동산, 중고, 커뮤니티 글을 등록하세요.",
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function WritePage({ searchParams }: PageProps) {
  const { section: sectionParam } = await searchParams;
  const sectionSlug =
    sectionParam && isWritableSection(sectionParam) ? sectionParam : undefined;

  if (sectionParam && !sectionSlug) {
    notFound();
  }

  const categories = await getWritableCategories(
    sectionSlug ? { sectionSlug } : undefined
  );

  if (categories.length === 0) {
    notFound();
  }

  const meta = sectionSlug ? WRITE_SECTION_META[sectionSlug] : null;
  const defaultCategoryId =
    categories.find((c) => c.slug === meta?.defaultCategorySlug)?.id ??
    categories[0]!.id;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-white">
      <WriteForm
        pageTitle={meta?.title ?? "글쓰기"}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        sectionSlug={sectionSlug}
      />
    </div>
  );
}
