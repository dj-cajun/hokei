import { prisma } from "@/lib/prisma";

async function searchIdsForTerm(
  pattern: string,
  limit: number
): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Post"
    WHERE status = 'PUBLISHED'
      AND (
        title ILIKE ${pattern}
        OR summary ILIKE ${pattern}
        OR content ILIKE ${pattern}
      )
    ORDER BY "publishedAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.id);
}

/** PostgreSQL ILIKE 기반 검색 (복수 키워드는 AND) */
export async function searchPostIdsByPg(
  query: string,
  limit: number
): Promise<string[]> {
  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (terms.length === 0) return [];

  if (terms.length === 1) {
    return searchIdsForTerm(`%${terms[0]}%`, limit);
  }

  let intersection = new Set<string>();
  let first = true;
  const fetchLimit = Math.min(limit * 5, 200);

  for (const term of terms) {
    const ids = await searchIdsForTerm(`%${term}%`, fetchLimit);
    const set = new Set(ids);
    if (first) {
      intersection = set;
      first = false;
    } else {
      intersection = new Set([...intersection].filter((id) => set.has(id)));
    }
    if (intersection.size === 0) return [];
  }

  const ordered = [...intersection];
  if (ordered.length <= limit) return ordered;

  const posts = await prisma.post.findMany({
    where: { id: { in: ordered.slice(0, fetchLimit) } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: { id: true },
  });
  return posts.map((p) => p.id);
}
