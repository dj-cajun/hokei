import { prisma } from "@/lib/prisma";

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase().slice(0, 100);
}

export async function recordSearchQuery(raw: string): Promise<void> {
  const query = normalizeSearchQuery(raw);
  if (query.length < 2) return;

  try {
    await prisma.searchQueryStat.upsert({
      where: { query },
      create: { query, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    /* 스키마 미적용 환경 */
  }
}

export async function getPopularSearchQueries(limit = 10) {
  try {
    return await prisma.searchQueryStat.findMany({
      orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
      take: limit,
      select: { query: true, count: true },
    });
  } catch {
    return [];
  }
}
