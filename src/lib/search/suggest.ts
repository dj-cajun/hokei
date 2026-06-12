import { prisma } from "@/lib/prisma";
import { visiblePostWhere } from "@/lib/moderation";
import { SEARCH_MIN_QUERY_LENGTH } from "@/lib/constants";

export async function suggestSearchTitles(query: string, limit = 8) {
  const q = query.trim();
  if (q.length < 2) return [];

  return prisma.post.findMany({
    where: {
      ...visiblePostWhere,
      title: { contains: q },
    },
    select: {
      id: true,
      title: true,
      category: { select: { label: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

export async function suggestSearchTitlesSafe(query: string) {
  if (query.trim().length < SEARCH_MIN_QUERY_LENGTH) {
    return suggestSearchTitles(query, 8);
  }
  return suggestSearchTitles(query, 8);
}
