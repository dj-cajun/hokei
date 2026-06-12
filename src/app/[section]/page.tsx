import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SectionArchivePage } from "@/components/category/section-archive-page";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { getSectionBySlug, getSectionSlugs } from "@/lib/categories";
import { isDatabaseAvailable } from "@/lib/database-available";
import {
  countPostsBySectionSlug,
  getPostsBySectionSlug,
} from "@/lib/posts";
import { parseRegionParam } from "@/lib/regions";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string; region?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getSectionSlugs();
  return slugs.filter((s) => s.section !== "news");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section: sectionSlug } = await params;
  const section = await getSectionBySlug(sectionSlug);
  if (!section) return { title: "호케이 Hokei" };
  return {
    title: `${section.label} - 호케이 Hokei`,
    description: section.description ?? undefined,
    openGraph: {
      title: `${section.label} - 호케이 Hokei`,
      description: section.description ?? section.label,
      locale: "ko_KR",
      type: "website",
    },
  };
}

export default async function SectionRoutePage({
  params,
  searchParams,
}: PageProps) {
  const { section: sectionSlug } = await params;

  if (sectionSlug === "news") {
    redirect("/news");
  }

  const section = await getSectionBySlug(sectionSlug);
  if (!section) notFound();

  const { page: pageParam, region: regionParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const communityOnly = sectionSlug === "community";
  const region = parseRegionParam(regionParam);
  const listOptions = {
    ...(communityOnly ? { communityOnly: true as const } : {}),
    region,
  };

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsBySectionSlug(
          sectionSlug,
          LIST_PAGE_SIZE,
          currentPage,
          listOptions
        ),
        countPostsBySectionSlug(sectionSlug, listOptions),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));

  return (
    <SectionArchivePage
      sectionSlug={section.slug}
      label={section.label}
      description={section.description}
      colorClass={section.colorClass}
      icon={section.icon}
      basePath={section.href}
      posts={posts}
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
      region={region}
    />
  );
}
