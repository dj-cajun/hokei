import { prisma } from "@/lib/prisma";
import { visiblePostWhere } from "@/lib/moderation";

export async function getUserActivityStats(userId: string) {
  const [posts, comments, likes, bookmarks] = await Promise.all([
    prisma.post.count({
      where: { authorId: userId, ...visiblePostWhere },
    }),
    prisma.comment.count({
      where: { authorId: userId, isHidden: false },
    }),
    prisma.postLike.count({ where: { userId } }),
    prisma.bookmark.count({ where: { userId } }),
  ]);

  return { posts, comments, likes, bookmarks };
}

export async function getUserPosts(userId: string, limit = 30) {
  return prisma.post.findMany({
    where: { authorId: userId, ...visiblePostWhere },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      publishedAt: true,
      category: { select: { label: true } },
    },
  });
}

export async function getUserComments(userId: string, limit = 30) {
  return prisma.comment.findMany({
    where: { authorId: userId, isHidden: false },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      createdAt: true,
      post: {
        select: { id: true, title: true },
      },
    },
  });
}

export async function getUserLikedPosts(userId: string, limit = 30) {
  return prisma.postLike.findMany({
    where: { userId, post: visiblePostWhere },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          publishedAt: true,
          category: { select: { label: true } },
        },
      },
    },
  });
}

export function isOAuthOnlyUser(user: {
  kakaoId: string | null;
  password: string;
}) {
  return Boolean(user.kakaoId) || user.password.startsWith("oauth-google-");
}
