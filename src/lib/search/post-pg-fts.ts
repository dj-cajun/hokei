import { prisma } from "@/lib/prisma";

let ftsReadyCache: boolean | null = null;

/** PostgreSQL tsvector + GIN 인덱스 준비 여부 */
export async function isPgFtsReady(): Promise<boolean> {
  if (ftsReadyCache !== null) return ftsReadyCache;
  try {
    const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'post_search_idx'
      ) AS exists
    `;
    ftsReadyCache = Boolean(rows[0]?.exists);
    return ftsReadyCache;
  } catch {
    ftsReadyCache = false;
    return false;
  }
}

export function resetPgFtsReadyCache(): void {
  ftsReadyCache = null;
}

export async function searchPostIdsByPgFts(
  query: string,
  limit: number
): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Post"
    WHERE status = 'PUBLISHED'
      AND search_vector @@ plainto_tsquery('simple', ${q})
    ORDER BY ts_rank(search_vector, plainto_tsquery('simple', ${q})) DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => r.id);
}

/** 전체 게시글 search_vector 재구성 */
export async function indexPostInPgFts(post: {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  status: string;
}): Promise<void> {
  if (!(await isPgFtsReady())) return;
  if (post.status !== "PUBLISHED") {
    await removePostFromPgFts(post.id);
    return;
  }
  const text = `${post.title} ${post.summary} ${post.content ?? ""}`;
  await prisma.$executeRaw`
    UPDATE "Post"
    SET search_vector = to_tsvector('simple', ${text})
    WHERE id = ${post.id}
  `;
}

export async function removePostFromPgFts(postId: string): Promise<void> {
  if (!(await isPgFtsReady())) return;
  await prisma.$executeRaw`
    UPDATE "Post" SET search_vector = NULL WHERE id = ${postId}
  `;
}

export async function reindexAllPostsPgFts(): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE "Post"
    SET search_vector = to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')
    )
    WHERE status = 'PUBLISHED'
  `;
  resetPgFtsReadyCache();
  return typeof result === "number" ? result : 0;
}
