import { prisma } from "@/lib/prisma";
import {
  formatDateLabelHoChiMinh,
  formatRelativeTime,
  isTodayInHoChiMinh,
} from "@/lib/format/date";
import {
  getNewsBoardWhere,
  type NewsBoardSlug,
} from "@/lib/news-boards";
import type { FeedItem } from "@/types/feed";
import type { PostTopic } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

/** 뉴스 섹션 자동 수집 글 (서브카테고리·본문 news 포함) */
export const newsAutomatedWhere = {
  status: "PUBLISHED" as const,
  isAutomated: true,
  category: {
    OR: [{ slug: "news" }, { parent: { slug: "news" } }],
  },
};

const archiveInclude = {
  category: { select: { label: true, colorClass: true } },
} as const;

function toNewsArchiveItem(post: {
  id: string;
  title: string;
  publishedAt: Date;
  ingestedAt: Date;
  views: number;
  commentCount: number;
  thumbnail: string | null;
  sourceUrl: string;
  topic: PostTopic;
  category: { label: string; colorClass: string };
}): FeedItem {
  return {
    id: post.id,
    category: post.category.label,
    categoryColor: post.category.colorClass,
    title: post.title,
    date: formatRelativeTime(post.publishedAt),
    dateLabel: formatDateLabelHoChiMinh(post.ingestedAt),
    isNew: isTodayInHoChiMinh(post.ingestedAt),
    views: post.views,
    comments: post.commentCount,
    thumbnail: post.thumbnail ?? undefined,
    sourceUrl: post.sourceUrl,
    topic: post.topic,
  };
}

async function fetchNewsPosts(
  where: Prisma.PostWhereInput,
  limit: number,
  page: number
): Promise<FeedItem[]> {
  const safePage = Math.max(1, page);
  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ ingestedAt: "desc" }, { publishedAt: "desc" }],
    skip: (safePage - 1) * limit,
    take: limit,
    include: archiveInclude,
  });
  return posts.map(toNewsArchiveItem);
}

export async function countNewsArchivePosts(): Promise<number> {
  return prisma.post.count({ where: newsAutomatedWhere });
}

export async function getNewsArchivePosts(
  limit: number,
  page = 1
): Promise<FeedItem[]> {
  return fetchNewsPosts(newsAutomatedWhere, limit, page);
}

export async function countNewsBoardPosts(slug: NewsBoardSlug): Promise<number> {
  return prisma.post.count({ where: getNewsBoardWhere(slug) });
}

export async function getNewsBoardPosts(
  slug: NewsBoardSlug,
  limit: number,
  page = 1
): Promise<FeedItem[]> {
  return fetchNewsPosts(getNewsBoardWhere(slug), limit, page);
}

export type NewsDateGroup = {
  dateLabel: string;
  items: FeedItem[];
};

/** 같은 수집일(호치민)끼리 묶기 — 페이지 내 그룹 헤더용 */
export function groupNewsByIngestDate(items: FeedItem[]): NewsDateGroup[] {
  const groups: NewsDateGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.dateLabel === item.dateLabel) {
      last.items.push(item);
    } else {
      groups.push({ dateLabel: item.dateLabel, items: [item] });
    }
  }
  return groups;
}
