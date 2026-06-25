import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HereHowSubNav } from "@/components/category/here-how-sub-nav";
import { MiddleCategoryArchivePage } from "@/components/category/middle-category-archive-page";
import { SubcategoryPage } from "@/components/category/subcategory-page";
import { getCategoryByHref, getSectionBySlug } from "@/lib/categories";
import { mapSectionCategoryTabs } from "@/lib/section-category-tabs";
import { collectDescendantCategorySlugs } from "@/lib/category-tree";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { HERE_HOW_HREF } from "@/lib/here-how";
import {
  countPostsByCategorySlug,
  countPostsByCategorySlugs,
  getPostsByCategorySlug,
  getPostsByCategorySlugs,
} from "@/lib/posts";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ section: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  const category = await getCategoryByHref(`/${section}/${slug}`);
  if (!category) return { title: "호케이 Hokei" };
  return {
    title: `${category.label} - 호케이 Hokei`,
    description: category.description ?? undefined,
  };
}

function categoryHasChildren(
  category: Awaited<ReturnType<typeof getCategoryByHref>>
): boolean {
  if (!category) return false;
  if ("children" in category && Array.isArray(category.children)) {
    return category.children.length > 0;
  }
  return false;
}

export default async function SubcategoryRoutePage({
  params,
  searchParams,
}: PageProps) {
  const { section, slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const href = `/${section}/${slug}`;

  const category = await getCategoryByHref(href);
  if (!category) notFound();

  const isMiddleParent = categoryHasChildren(category);

  if (isMiddleParent) {
    const leafSlugs =
      isDatabaseAvailable() && "id" in category
        ? await collectDescendantCategorySlugs(category.id)
        : category.children.map((c: { slug: string }) => c.slug);

    const [posts, totalCount] = isDatabaseAvailable()
      ? await Promise.all([
          getPostsByCategorySlugs(leafSlugs, LIST_PAGE_SIZE, currentPage),
          countPostsByCategorySlugs(leafSlugs),
        ])
      : [[], 0];

    const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));
    const root =
      "parent" in category && category.parent
        ? category.parent
        : { label: section, href: `/${section}` };

    return (
      <MiddleCategoryArchivePage
        sectionSlug={section}
        sectionLabel={root.label}
        sectionHref={root.href ?? `/${section}`}
        label={category.label}
        description={category.description}
        colorClass={category.colorClass}
        icon={category.icon}
        listHref={href}
        posts={posts}
        totalCount={totalCount}
        currentPage={Math.min(currentPage, totalPages)}
        totalPages={totalPages}
        subNav={href === HERE_HOW_HREF ? <HereHowSubNav /> : undefined}
      />
    );
  }

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsByCategorySlug(category.slug, LIST_PAGE_SIZE, currentPage),
        countPostsByCategorySlug(category.slug),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));
  const parent =
    "parent" in category && category.parent ? category.parent : null;
  if (!parent) notFound();

  const sectionData = await getSectionBySlug(section);
  const categoryTabs = mapSectionCategoryTabs(
    sectionData && "children" in sectionData && Array.isArray(sectionData.children)
      ? sectionData.children
      : []
  );

  return (
    <SubcategoryPage
      sectionSlug={section}
      sectionLabel={parent.label}
      sectionHref={parent.href ?? `/${section}`}
      listHref={category.href}
      label={category.label}
      description={category.description}
      colorClass={category.colorClass}
      icon={category.icon}
      posts={posts}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
      isNewsSection={section === "news"}
      categoryTabs={categoryTabs}
    />
  );
}
