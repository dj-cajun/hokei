import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionArchivePage } from "@/components/category/section-archive-page";
import { PopularPostsStrip } from "@/components/home/popular-posts-strip";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getSectionBySlug } from "@/lib/categories";
import { MOBILE_COMMUNITY_LIST_HREF } from "@/lib/mobile-nav-config";
import { parseRegionParam } from "@/lib/regions";
import {
  countCommunityPosts,
  getCommunityArchivePosts,
  getPopularUserPosts,
} from "@/lib/posts";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const section = await getSectionBySlug("community");
  if (!section) {
    return { title: "소통 커뮤니티 - 호케이 Hokei" };
  }
  return {
    title: `${section.label} - 호케이 Hokei`,
    description:
      section.description ??
      "호치민 한국 교민 자유게시판·질문방 전체 글을 모아 둡니다.",
    openGraph: {
      title: `${section.label} - 호케이 Hokei`,
      description: section.description ?? section.label,
      locale: "ko_KR",
      type: "website",
    },
  };
}

interface PageProps {
  searchParams: Promise<{ page?: string; region?: string }>;
}

export default async function CommunityPage({ searchParams }: PageProps) {
  const section = await getSectionBySlug("community");
  if (!section) notFound();

  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const region = parseRegionParam(params.region);

  const [posts, totalCount, popular] = isDatabaseAvailable()
    ? await Promise.all([
        getCommunityArchivePosts(LIST_PAGE_SIZE, currentPage, region),
        countCommunityPosts(region),
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
        basePath={MOBILE_COMMUNITY_LIST_HREF}
        posts={posts}
        totalCount={totalCount}
        currentPage={Math.min(currentPage, totalPages)}
        totalPages={totalPages}
        region={region}
      />
    </>
  );
}
