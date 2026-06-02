import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsBoardPage } from "@/components/category/news-board-page";
import { isDatabaseAvailable } from "@/lib/database-available";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import {
  getNewsBoardConfig,
  NEWS_BOARD_ITEMS,
  type NewsBoardSlug,
} from "@/lib/news-boards";
import {
  countNewsBoardPosts,
  getNewsBoardPosts,
  groupNewsByIngestDate,
} from "@/lib/news-archive";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return NEWS_BOARD_ITEMS.map((b) => ({ boardSlug: b.slug }));
}

interface PageProps {
  params: Promise<{ boardSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boardSlug } = await params;
  const board = getNewsBoardConfig(boardSlug);
  if (!board) return { title: "뉴스 - 호케이 Hokei" };
  return {
    title: `${board.title} - 호케이 Hokei`,
    description: board.description,
  };
}

export default async function NewsBoardRoutePage({
  params,
  searchParams,
}: PageProps) {
  const { boardSlug } = await params;
  const board = getNewsBoardConfig(boardSlug);
  if (!board) notFound();

  const slug = board.slug as NewsBoardSlug;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [posts, totalCount] = isDatabaseAvailable()
    ? await Promise.all([
        getNewsBoardPosts(slug, LIST_PAGE_SIZE, currentPage),
        countNewsBoardPosts(slug),
      ])
    : [[], 0];

  const totalPages = Math.max(1, Math.ceil(totalCount / LIST_PAGE_SIZE));

  return (
    <NewsBoardPage
      title={board.title}
      description={board.description}
      boardHref={board.href}
      dateGroups={groupNewsByIngestDate(posts)}
      totalCount={totalCount}
      currentPage={Math.min(currentPage, totalPages)}
      totalPages={totalPages}
    />
  );
}
