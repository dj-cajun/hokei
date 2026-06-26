import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubcategoryPage } from "@/components/category/subcategory-page";
import { getNestedLeafByPath, getNestedLeafParams } from "@/lib/categories";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { HERE_HOW_HREF } from "@/lib/here-how";
import {
  countPostsByCategorySlug,
  getPostsByCategorySlug,
} from "@/lib/posts";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ section: string; slug: string; child: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  return getNestedLeafParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug, child } = await params;
  const category = await getNestedLeafByPath(section, slug, child);
  if (!category) return { title: "호케이 Hokei" };
  return {
    title: `${category.label} - 호케이 Hokei`,
    description: category.description ?? undefined,
  };
}

export default async function NestedLeafRoutePage({
  params,
  searchParams,
}: PageProps) {
  const { section, slug, child } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const category = await getNestedLeafByPath(section, slug, child);
  if (!category?.parent) notFound();

  const midParent = category.parent;

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsByCategorySlug(category.slug, LIST_PAGE_SIZE, currentPage),
        countPostsByCategorySlug(category.slug),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));
  const midHref = midParent.href ?? `/${section}/${slug}`;
  const showHereHowSubNav = midHref === HERE_HOW_HREF;

  return (
    <SubcategoryPage
      sectionSlug={section}
      sectionLabel={midParent.label}
      sectionHref={midHref}
      listHref={category.href}
      label={category.label}
      description={category.description}
      colorClass={category.colorClass}
      icon={category.icon}
      posts={posts}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
      isNewsSection={section === "news"}
      showHereHowSubNav={showHereHowSubNav}
    />
  );
}
