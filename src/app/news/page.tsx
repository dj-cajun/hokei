import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsArchivePage } from "@/components/category/news-archive-page";
import { isDatabaseAvailable } from "@/lib/database-available";
import { log } from "@/lib/logger";
import { getSectionBySlug } from "@/lib/categories";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import {
  countNewsArchivePosts,
  getNewsArchivePosts,
  groupNewsByIngestDate,
} from "@/lib/news-archive";

export const revalidate = 120;

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

  let posts: Awaited<ReturnType<typeof getNewsArchivePosts>> = [];
  let totalCount = 0;

  if (!isDatabaseAvailable()) {
    log("warn", "news archive: DATABASE_URL unavailable", {
      vercel: process.env.VERCEL === "1",
    });
  } else {
    try {
      [posts, totalCount] = await Promise.all([
        getNewsArchivePosts(LIST_PAGE_SIZE, currentPage),
        countNewsArchivePosts(),
      ]);
    } catch (error) {
      log("error", "news archive query failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));

  return (
    <NewsArchivePage
      label={section.label}
      dateGroups={groupNewsByIngestDate(posts)}
      flatItems={posts}
      initialCursor={
        posts.length >= LIST_PAGE_SIZE && posts.length < totalCount
          ? (posts.at(-1)?.id ?? null)
          : null
      }
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
    />
  );
}
