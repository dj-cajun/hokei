import { prisma } from "@/lib/prisma";
import {
  formatDateLabelHoChiMinh,
  formatRelativeTime,
  isTodayInHoChiMinh,
} from "@/lib/format/date";
import { newsAutomatedWhere } from "@/lib/news/news-list-where";
import type { FeedItem } from "@/types/feed";
import type { PostTopic } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";

export { groupNewsByIngestDate, type NewsDateGroup } from "@/lib/news/group-news-by-date";

export { newsAutomatedWhere } from "@/lib/news/news-list-where";

const archiveInclude = {
  category: { select: { label: true, colorClass: true } },
  _count: { select: { comments: true } },
} as const;

function toNewsArchiveItem(post: {
  id: string;
  title: string;
  publishedAt: Date;
  ingestedAt: Date;
  views: number;
  commentCount: number;
  _count?: { comments: number };
  thumbnail: string | null;
  sourceUrl: string;
  topic: PostTopic;
  category: { label: string; colorClass: string };
}): FeedItem {
  const comments =
    post._count?.comments ?? post.commentCount ?? 0;
  return {
    id: post.id,
    category: post.category.label,
    categoryColor: post.category.colorClass,
    title: post.title,
    date: formatRelativeTime(post.publishedAt),
    dateLabel: formatDateLabelHoChiMinh(post.ingestedAt),
    isNew: isTodayInHoChiMinh(post.ingestedAt),
    views: post.views,
    comments,
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

/** 뉴스 아카이브 커서 무한 스크롤 — cursor는 마지막 글 id */
export async function getNewsArchivePostsCursor(
  limit: number,
  cursor?: string | null
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  let where: Prisma.PostWhereInput = newsAutomatedWhere;

  if (cursor) {
    const anchor = await prisma.post.findUnique({
      where: { id: cursor },
      select: { id: true, ingestedAt: true },
    });
    if (anchor) {
      where = {
        AND: [
          newsAutomatedWhere,
          {
            OR: [
              { ingestedAt: { lt: anchor.ingestedAt } },
              {
                ingestedAt: anchor.ingestedAt,
                id: { lt: anchor.id },
              },
            ],
          },
        ],
      };
    }
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ ingestedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: archiveInclude,
  });

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const items = slice.map(toNewsArchiveItem);
  const nextCursor = hasMore ? (slice.at(-1)?.id ?? null) : null;

  return { items, nextCursor };
}
