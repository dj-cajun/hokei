import { LifeInfoHubPage } from "@/components/category/life-info-hub-page";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { lifeInfoSectionSlugsForHub } from "@/lib/life-info-hub";
import {
  countPostsBySectionSlugs,
  getPostsBySectionSlugs,
} from "@/lib/posts";

export const metadata = {
  title: "찐 생활정보 - 호케이",
  description: "호치민 한인 맛집·부동산·중고·취업 정보를 한눈에",
};

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PromoPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams;
  const sectionSlugs = lifeInfoSectionSlugsForHub();
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getPostsBySectionSlugs(sectionSlugs, LIST_PAGE_SIZE, currentPage),
        countPostsBySectionSlugs(sectionSlugs),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));

  return (
    <LifeInfoHubPage
      posts={posts}
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
    />
  );
}
