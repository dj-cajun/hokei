import type { Metadata } from "next";
import { CommunityFeed } from "@/components/community/community-feed";
import { Pagination } from "@/components/ui/pagination";
import { COMMUNITY_PAGE_SIZE } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getSectionBySlug } from "@/lib/categories";
import {
  countCommunityPosts,
  getCommunityNotices,
  getLatestCommunityPosts,
  getPopularCommunityPosts,
} from "@/lib/posts";
import { notFound } from "next/navigation";
import type { FeedItem } from "@/types/feed";

const emptyFeed: FeedItem[] = [];

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
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const section = await getSectionBySlug("community");
  if (!section) notFound();

  const [latest, popular, notices, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getLatestCommunityPosts(COMMUNITY_PAGE_SIZE, currentPage),
        getPopularCommunityPosts(30),
        getCommunityNotices(20),
        countCommunityPosts(),
      ])
    : [emptyFeed, emptyFeed, emptyFeed, 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / COMMUNITY_PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-[480px] bg-[#f3f4f6]">
      <CommunityFeed
        latest={latest}
        popular={popular}
        notices={notices}
        subcategories={section.children.map((c) => ({
          label: c.label,
          href: c.href,
          description: c.description,
        }))}
      />
      <Pagination
        currentPage={Math.min(currentPage, totalPages)}
        totalPages={totalPages}
        basePath="/community"
      />
    </div>
  );
}
