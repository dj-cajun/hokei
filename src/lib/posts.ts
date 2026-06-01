import { getDatabaseKind, prisma } from "@/lib/prisma";
import type { PostTopic } from "@/generated/prisma/client";
import type { FeedItem, ListCommentPreview } from "@/types/feed";
import { COMMUNITY_SOURCE_PREFIX } from "@/lib/community";
import {
  COMMUNITY_PAGE_SIZE,
  LIST_PAGE_SIZE,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/lib/constants";
import {
  formatDateLabel,
  formatRelativeTime,
  isTodayInHoChiMinh,
} from "@/lib/format/date";

const communityWhere = {
  status: "PUBLISHED" as const,
  isAutomated: false,
  sourceUrl: { startsWith: COMMUNITY_SOURCE_PREFIX },
  category: { parent: { slug: "community" } },
};

function mapLatestComment(
  comments: {
    content: string;
    guestName: string | null;
    author: { name: string } | null;
  }[]
): ListCommentPreview | undefined {
  const latest = comments[0];
  if (!latest) return undefined;
  return {
    authorName: latest.author?.name ?? latest.guestName ?? "익명",
    content: latest.content,
  };
}

function toFeedItem(post: {
  id: string;
  title: string;
  publishedAt: Date;
  views: number;
  commentCount: number;
  thumbnail: string | null;
  sourceUrl: string;
  topic: PostTopic;
  category: { label: string; colorClass: string };
  comments: {
    content: string;
    guestName: string | null;
    author: { name: string } | null;
  }[];
}): FeedItem {
  return {
    id: post.id,
    category: post.category.label,
    categoryColor: post.category.colorClass,
    title: post.title,
    date: formatRelativeTime(post.publishedAt),
    dateLabel: formatDateLabel(post.publishedAt),
    isNew: isTodayInHoChiMinh(post.publishedAt),
    views: post.views,
    comments: post.commentCount,
    latestComment: mapLatestComment(post.comments),
    thumbnail: post.thumbnail ?? undefined,
    sourceUrl: post.sourceUrl,
    topic: post.topic,
  };
}

const postInclude = {
  category: { select: { label: true, colorClass: true } },
  comments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      content: true,
      guestName: true,
      author: { select: { name: true } },
    },
  },
} as const;

export async function getLatestPosts(limit = 20): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getPopularPosts(limit = 20): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function countCommunityPosts(): Promise<number> {
  return prisma.post.count({ where: communityWhere });
}

export async function getLatestCommunityPosts(
  limit = COMMUNITY_PAGE_SIZE,
  page = 1
): Promise<FeedItem[]> {
  const safePage = Math.max(1, page);
  const posts = await prisma.post.findMany({
    where: communityWhere,
    orderBy: { publishedAt: "desc" },
    skip: (safePage - 1) * limit,
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getPopularCommunityPosts(limit = 20): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: communityWhere,
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getCommunityNotices(limit = 10): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: { ...communityWhere, isNotice: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getPostsBySectionSlug(
  sectionSlug: string,
  limit = 30,
  options?: { communityOnly?: boolean }
): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      category: { parent: { slug: sectionSlug } },
      ...(options?.communityOnly
        ? { isAutomated: false, sourceUrl: { startsWith: COMMUNITY_SOURCE_PREFIX } }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getAutomatedNewsPosts(limit = 10): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED", isAutomated: true },
    orderBy: { ingestedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      category: {
        include: { parent: { select: { label: true, href: true, slug: true } } },
      },
      author: { select: { id: true, name: true } },
      attachments: { orderBy: { sortOrder: "asc" } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
}

function textContainsFilter(q: string) {
  if (getDatabaseKind() === "postgresql") {
    return [
      { title: { contains: q, mode: "insensitive" as const } },
      { content: { contains: q, mode: "insensitive" as const } },
      { summary: { contains: q, mode: "insensitive" as const } },
    ];
  }
  return [
    { title: { contains: q } },
    { content: { contains: q } },
    { summary: { contains: q } },
  ];
}

export async function searchPosts(query: string, limit = 40): Promise<FeedItem[]> {
  const q = query.trim();
  if (q.length < SEARCH_MIN_QUERY_LENGTH) return [];

  let rankedIds: string[] = [];

  if (getDatabaseKind() === "sqlite") {
    const { searchPostIdsByFts } = await import("@/lib/search/post-fts");
    rankedIds = await searchPostIdsByFts(q, limit);
  } else {
    const { isPgFtsReady, searchPostIdsByPgFts } =
      await import("@/lib/search/post-pg-fts");
    if (await isPgFtsReady()) {
      rankedIds = await searchPostIdsByPgFts(q, limit);
    }
    if (rankedIds.length === 0) {
      const { searchPostIdsByPg } = await import("@/lib/search/post-pg");
      rankedIds = await searchPostIdsByPg(q, limit);
    }
  }

  if (rankedIds.length > 0) {
    const posts = await prisma.post.findMany({
      where: { id: { in: rankedIds }, status: "PUBLISHED" },
      include: postInclude,
    });
    const order = new Map(rankedIds.map((id, i) => [id, i]));
    posts.sort(
      (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
    );
    return posts.map(toFeedItem);
  }

  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: textContainsFilter(q),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });

  return posts.map(toFeedItem);
}

const publishedByCategorySlug = (categorySlug: string) => ({
  status: "PUBLISHED" as const,
  category: { slug: categorySlug },
});

export async function countPostsByCategorySlug(
  categorySlug: string
): Promise<number> {
  return prisma.post.count({
    where: publishedByCategorySlug(categorySlug),
  });
}

export async function getPostsByCategorySlug(
  categorySlug: string,
  limit = LIST_PAGE_SIZE,
  page = 1
): Promise<FeedItem[]> {
  const safePage = Math.max(1, page);
  const posts = await prisma.post.findMany({
    where: publishedByCategorySlug(categorySlug),
    orderBy: { publishedAt: "desc" },
    skip: (safePage - 1) * limit,
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export type BoardPreviewRow = {
  id: string;
  title: string;
  href: string;
  dateLabel: string;
  isNew: boolean;
  commentCount?: number;
  views?: number;
  latestComment?: ListCommentPreview;
};

function toBoardPreviewRow(p: {
  id: string;
  title: string;
  publishedAt: Date;
  commentCount: number;
  views: number;
  comments: {
    content: string;
    guestName: string | null;
    author: { name: string } | null;
  }[];
}): BoardPreviewRow {
  return {
    id: p.id,
    title: p.title,
    href: `/posts/${p.id}`,
    dateLabel: formatDateLabel(p.publishedAt),
    isNew: isTodayInHoChiMinh(p.publishedAt),
    commentCount: p.commentCount,
    views: p.views,
    latestComment: mapLatestComment(p.comments),
  };
}

export async function getSectionBoardPreview(
  sectionSlug: string,
  limit = 4,
  options?: { communityOnly?: boolean }
): Promise<BoardPreviewRow[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      category: { parent: { slug: sectionSlug } },
      ...(options?.communityOnly
        ? { isAutomated: false, sourceUrl: { startsWith: COMMUNITY_SOURCE_PREFIX } }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });

  return posts.map(toBoardPreviewRow);
}

export async function getCommunityBoardPreview(limit = 4) {
  return getSectionBoardPreview("community", limit, { communityOnly: true });
}
