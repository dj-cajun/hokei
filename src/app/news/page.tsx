import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArchivePage } from "@/components/category/news-archive-page";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getSectionBySlug } from "@/lib/categories";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import {
  countNewsArchivePosts,
  getNewsArchivePosts,
  groupNewsByIngestDate,
} from "@/lib/news-archive";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const section = await getSectionBySlug("news");
  if (!section) return { title: "뉴스 - 호케이 Hokei" };
  return {
    title: `${section.label} - 호케이 Hokei`,
    description:
      section.description ??
      "호치민 교민 뉴스 아카이브. 자동 수집 기사를 날짜별로 모아 둡니다.",
    openGraph: {
      title: `${section.label} - 호케이 Hokei`,
      description: section.description ?? section.label,
      locale: "ko_KR",
      type: "website",
    },
  };
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewsArchiveRoutePage({ searchParams }: PageProps) {
  const section = await getSectionBySlug("news");
  if (!section) notFound();

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getNewsArchivePosts(LIST_PAGE_SIZE, currentPage),
        countNewsArchivePosts(),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));

  return (
    <NewsArchivePage
      label={section.label}
      colorClass={section.colorClass}
      subcategories={section.children.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        href: c.href,
        icon: c.icon,
      }))}
      dateGroups={groupNewsByIngestDate(posts)}
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
    />
  );
}
