import { prisma } from "@/lib/prisma";

export async function isPostBookmarked(
  userId: string,
  postId: string
): Promise<boolean> {
  const row = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { id: true },
  });
  return Boolean(row);
}

export async function getUserBookmarks(userId: string, limit = 30) {
  return prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          summary: true,
          publishedAt: true,
          category: { select: { label: true, href: true } },
        },
      },
    },
  });
}
