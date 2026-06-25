import { HereHowSubNav } from "@/components/category/here-how-sub-nav";
import { MiddleCategoryArchivePage } from "@/components/category/middle-category-archive-page";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { getCategoryByHref } from "@/lib/categories";
import { collectDescendantCategorySlugs } from "@/lib/category-tree";
import { isDatabaseAvailable } from "@/lib/database-available";
import { HERE_HOW_HREF, HERE_HOW_LEAF_SLUGS } from "@/lib/here-how";
import {
  countPostsByCategorySlugs,
  getPostsByCategorySlugs,
} from "@/lib/posts";
import { notFound } from "next/navigation";

export const metadata = {
  title: "여기 어때 - 호케이",
  description: "배고플때·불편할때 맛집·서비스 추천",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HereHowRoutePage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const category = await getCategoryByHref(HERE_HOW_HREF);
  if (!category) notFound();

  let slugs: string[] = [...HERE_HOW_LEAF_SLUGS];
  if (isDatabaseAvailable() && "id" in category && category.id) {
    const collected = await collectDescendantCategorySlugs(category.id);
    if (collected.length > 0) slugs = collected;
  }

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsByCategorySlugs(slugs, LIST_PAGE_SIZE, currentPage),
        countPostsByCategorySlugs(slugs),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));
  const section =
    "parent" in category && category.parent ? category.parent : null;

  return (
    <MiddleCategoryArchivePage
      sectionSlug="promo"
      sectionLabel={section?.label ?? "찐 생활정보"}
      sectionHref="/promo"
      label={category.label}
      description={category.description}
      colorClass={category.colorClass}
      icon={category.icon}
      listHref={HERE_HOW_HREF}
      posts={posts}
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
      subNav={<HereHowSubNav />}
    />
  );
}
