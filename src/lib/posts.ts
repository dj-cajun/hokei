import { getDatabaseKind, prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
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
import { visibleCommentWhere, visiblePostWhere } from "@/lib/moderation";
import { getRegionLabel } from "@/lib/regions";

export type PostListOptions = {
  communityOnly?: boolean;
  region?: string;
};

const communityWhere = {
  ...visiblePostWhere,
  isAutomated: false,
  sourceUrl: { startsWith: COMMUNITY_SOURCE_PREFIX },
  category: { parent: { slug: "community" } },
};

/** 구 스키마(likeCount·isNotice 미적용 DB) 호환 */
const postHasLikeCount = "likeCount" in Prisma.PostScalarFieldEnum;
const postHasNotice = "isNotice" in Prisma.PostScalarFieldEnum;

const viewsPopularOrderBy = [
  { views: "desc" as const },
  { publishedAt: "desc" as const },
] as const;

const popularPostOrderBy = postHasLikeCount
  ? ([
      { likeCount: "desc" as const },
      ...viewsPopularOrderBy,
    ] as const)
  : viewsPopularOrderBy;

function isMissingColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2022"
  );
}

async function findPopularPosts(
  where: Prisma.PostWhereInput,
  orderBy: readonly { [key: string]: "desc" }[],
  limit: number
): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where,
    orderBy: [...orderBy],
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

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

function resolveCommentCount(post: {
  _count?: { comments?: number };
  commentCount?: number;
}): number {
  return post._count?.comments ?? post.commentCount ?? 0;
}

function toFeedItem(post: {
  id: string;
  title: string;
  publishedAt: Date;
  views: number;
  likeCount?: number;
  commentCount: number;
  region?: string | null;
  _count?: { comments: number };
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
    likes: post.likeCount ?? 0,
    comments: resolveCommentCount(post),
    latestComment: mapLatestComment(post.comments),
    thumbnail: post.thumbnail ?? undefined,
    sourceUrl: post.sourceUrl,
    topic: post.topic,
    region: post.region ?? undefined,
    regionLabel: getRegionLabel(post.region),
  };
}

const postInclude = {
  category: { select: { label: true, colorClass: true } },
  _count: {
    select: {
      comments: { where: visibleCommentWhere },
    },
  },
  comments: {
    where: visibleCommentWhere,
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
    where: visiblePostWhere,
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getPopularPosts(limit = 20): Promise<FeedItem[]> {
  const posts = await prisma.post.findMany({
    where: visiblePostWhere,
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
  try {
    return await findPopularPosts(communityWhere, popularPostOrderBy, limit);
  } catch (error) {
    if (postHasLikeCount && isMissingColumnError(error)) {
      return findPopularPosts(communityWhere, viewsPopularOrderBy, limit);
    }
    throw error;
  }
}

/** 전체 회원 게시(부동산·중고·구인·커뮤니티) — 좋아요 기준 인기 */
export async function getPopularUserPosts(limit = 12): Promise<FeedItem[]> {
  const where = {
    ...visiblePostWhere,
    isAutomated: false,
    sourceUrl: { startsWith: COMMUNITY_SOURCE_PREFIX },
  };
  try {
    return await findPopularPosts(where, popularPostOrderBy, limit);
  } catch (error) {
    if (postHasLikeCount && isMissingColumnError(error)) {
      return findPopularPosts(where, viewsPopularOrderBy, limit);
    }
    throw error;
  }
}

export async function getCommunityNotices(limit = 10): Promise<FeedItem[]> {
  if (!postHasNotice) return [];

  const posts = await prisma.post.findMany({
    where: { ...communityWhere, isNotice: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

function publishedBySectionSlug(
  sectionSlug: string,
  options?: PostListOptions
) {
  return {
    ...visiblePostWhere,
    category: { parent: { slug: sectionSlug } },
    ...(options?.region ? { region: options.region } : {}),
    ...(options?.communityOnly
      ? {
          isAutomated: false,
          sourceUrl: { startsWith: COMMUNITY_SOURCE_PREFIX },
        }
      : {}),
  };
}

export async function countPostsBySectionSlug(
  sectionSlug: string,
  options?: PostListOptions
): Promise<number> {
  return prisma.post.count({
    where: publishedBySectionSlug(sectionSlug, options),
  });
}

export async function getPostsBySectionSlug(
  sectionSlug: string,
  limit = LIST_PAGE_SIZE,
  page = 1,
  options?: PostListOptions
): Promise<FeedItem[]> {
  const safePage = Math.max(1, page);
  const posts = await prisma.post.findMany({
    where: publishedBySectionSlug(sectionSlug, options),
    orderBy: { publishedAt: "desc" },
    skip: (safePage - 1) * limit,
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

/** 커서 기반 무한 스크롤 — cursor는 마지막 글 id */
export async function getPostsBySectionCursor(
  sectionSlug: string,
  limit = LIST_PAGE_SIZE,
  cursor?: string | null,
  options?: PostListOptions
): Promise<{ items: FeedItem[]; nextCursor: string | null }> {
  const baseWhere = publishedBySectionSlug(sectionSlug, options);

  let cursorWhere: Prisma.PostWhereInput = baseWhere;
  if (cursor) {
    const anchor = await prisma.post.findUnique({
      where: { id: cursor },
      select: { id: true, publishedAt: true },
    });
    if (anchor) {
      cursorWhere = {
        AND: [
          baseWhere,
          {
            OR: [
              { publishedAt: { lt: anchor.publishedAt } },
              { publishedAt: anchor.publishedAt, id: { lt: anchor.id } },
            ],
          },
        ],
      };
    }
  }

  const posts = await prisma.post.findMany({
    where: cursorWhere,
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: postInclude,
  });

  const hasMore = posts.length > limit;
  const slice = hasMore ? posts.slice(0, limit) : posts;
  const items = slice.map(toFeedItem);
  const nextCursor = hasMore ? (slice.at(-1)?.id ?? null) : null;

  return { items, nextCursor };
}

export async function getAutomatedNewsPosts(limit = 15): Promise<FeedItem[]> {
  const { newsAutomatedWhere } = await import("@/lib/news/news-list-where");
  const posts = await prisma.post.findMany({
    where: {
      ...visiblePostWhere,
      ...newsAutomatedWhere,
    },
    orderBy: { ingestedAt: "desc" },
    take: limit,
    include: postInclude,
  });
  return posts.map(toFeedItem);
}

export async function getPostById(
  id: string,
  options?: { includeHiddenComments?: boolean }
) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      category: {
        include: { parent: { select: { label: true, href: true, slug: true } } },
      },
      author: { select: { id: true, name: true } },
      attachments: { orderBy: { sortOrder: "asc" } },
      comments: {
        ...(options?.includeHiddenComments
          ? {}
          : { where: visibleCommentWhere }),
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

export async function searchPosts(
  query: string,
  limit = 40,
  filters?: import("@/lib/search/filter-options").SearchFilters
): Promise<FeedItem[]> {
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
      where: { id: { in: rankedIds }, ...visiblePostWhere },
      include: postInclude,
    });
    const order = new Map(rankedIds.map((id, i) => [id, i]));
    posts.sort(
      (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)
    );
    let items = posts.map(toFeedItem);
    if (filters) {
      items = await applySearchFilters(items, filters, limit);
    }
    if (filters?.sort === "recent") {
      items = [...items].sort((a, b) => (a.dateLabel < b.dateLabel ? 1 : -1));
    }
    return items.slice(0, limit);
  }

  const posts = await prisma.post.findMany({
    where: {
      ...visiblePostWhere,
      OR: textContainsFilter(q),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: postInclude,
  });

  let items = posts.map(toFeedItem);
  if (filters) {
    items = await applySearchFilters(items, filters, limit);
  }
  if (filters?.sort === "recent") {
    items = [...items].sort((a, b) => (a.dateLabel < b.dateLabel ? 1 : -1));
  }
  return items.slice(0, limit);
}

async function applySearchFilters(
  items: FeedItem[],
  filters: import("@/lib/search/filter-options").SearchFilters,
  limit: number
): Promise<FeedItem[]> {
  const { periodCutoff } = await import("@/lib/search/filter-options");
  const ids = items.map((i) => i.id);
  if (ids.length === 0) return [];

  const cutoff = periodCutoff(filters.period ?? "all");
  const section = filters.section ?? "all";

  const rows = await prisma.post.findMany({
    where: {
      id: { in: ids },
      ...(cutoff ? { publishedAt: { gte: cutoff } } : {}),
      ...(section !== "all"
        ? {
            category: {
              OR: [{ parent: { slug: section } }, { slug: section }],
            },
          }
        : {}),
      ...(filters.region ? { region: filters.region } : {}),
    },
    select: { id: true },
    take: limit * 2,
  });

  const allowed = new Set(rows.map((r) => r.id));
  return items.filter((i) => allowed.has(i.id));
}

const publishedByCategorySlug = (categorySlug: string) => ({
  ...visiblePostWhere,
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
  _count?: { comments: number };
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
    commentCount: resolveCommentCount(p),
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
      ...visiblePostWhere,
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
