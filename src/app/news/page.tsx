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
      "호치민·베트남 교민을 위한 뉴스를 날짜별로 모아 둡니다.",
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
  let loadError: string | null = null;

  if (!isDatabaseAvailable()) {
    loadError = "DATABASE_URL이 설정되지 않았습니다 (.env 확인)";
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
      loadError =
        error instanceof Error
          ? error.message
          : "뉴스 목록을 불러오지 못했습니다 (Neon 연결 확인)";
      log("error", "news archive query failed", {
        error: loadError,
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
      loadError={loadError}
    />
  );
}
