import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubcategoryPage } from "@/components/category/subcategory-page";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getSubcategoryByPath, getSubcategoryParams } from "@/lib/categories";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import {
  countPostsByCategorySlug,
  getPostsByCategorySlug,
} from "@/lib/posts";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ section: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  return getSubcategoryParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section, slug } = await params;
  const category = await getSubcategoryByPath(section, slug);
  if (!category) return { title: "호케이 Hokei" };
  return {
    title: `${category.label} - 호케이 Hokei`,
    description: category.description ?? undefined,
    openGraph: {
      title: `${category.label} - 호케이 Hokei`,
      description: category.description ?? category.label,
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default async function SubcategoryRoutePage({
  params,
  searchParams,
}: PageProps) {
  const { section, slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const category = await getSubcategoryByPath(section, slug);
  if (!category?.parent) notFound();

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsByCategorySlug(category.slug, LIST_PAGE_SIZE, currentPage),
        countPostsByCategorySlug(category.slug),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));
  const sectionSlug = section;

  return (
    <SubcategoryPage
      sectionSlug={sectionSlug}
      sectionLabel={category.parent.label}
      sectionHref={category.parent.href}
      listHref={category.href}
      label={category.label}
      description={category.description}
      colorClass={category.colorClass}
      icon={category.icon}
      posts={posts}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
      isNewsSection={sectionSlug === "news"}
    />
  );
}
