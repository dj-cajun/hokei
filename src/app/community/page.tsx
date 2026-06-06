import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionArchivePage } from "@/components/category/section-archive-page";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getSectionBySlug } from "@/lib/categories";
import { PopularPostsStrip } from "@/components/home/popular-posts-strip";
import {
  countPostsBySectionSlug,
  getPopularUserPosts,
  getPostsBySectionSlug,
} from "@/lib/posts";

export const metadata: Metadata = {
  title: "커뮤니티 - 호케이 Hokei",
  description:
    "호치민 한국 교민 커뮤니티. 자유게시판, 생활정보, Q&A를 나눠 보세요.",
  openGraph: {
    title: "커뮤니티 - 호케이 Hokei",
    description: "호치민 한국 교민 커뮤니티",
    locale: "ko_KR",
    type: "website",
  },
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const section = await getSectionBySlug("community");
  if (!section) notFound();

  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, totalCount, popular] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsBySectionSlug("community", LIST_PAGE_SIZE, currentPage, {
          communityOnly: true,
        }),
        countPostsBySectionSlug("community", { communityOnly: true }),
        getPopularUserPosts(8),
      ])
    : [[], 0, []];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));

  return (
    <>
    <div className="mx-auto w-full max-w-[480px] lg:max-w-6xl">
      <PopularPostsStrip items={popular} title="커뮤니티 인기글" />
    </div>
    <SectionArchivePage
      sectionSlug={section.slug}
      label={section.label}
      description={section.description}
      colorClass={section.colorClass}
      icon={section.icon}
      basePath="/community"
      posts={posts}
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
    />
    </>
  );
}
