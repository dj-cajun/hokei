import { getDatabaseKind, prisma } from "@/lib/prisma";

let ftsReady = false;

function escapeFtsToken(token: string): string {
  return token.replace(/"/g, '""').replace(/[^\w\s가-힣_-]/g, "");
}

export function buildFtsMatchQuery(query: string): string | null {
  const terms = query
    .trim()
    .split(/\s+/)
    .map(escapeFtsToken)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return null;

  return terms.map((t) => `"${t}"`).join(" AND ");
}

export async function ensurePostFtsTable(): Promise<void> {
  if (getDatabaseKind() !== "sqlite") return;
  if (ftsReady) return;

  await prisma.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE IF NOT EXISTS post_fts USING fts5(
      post_id UNINDEXED,
      title,
      summary,
      content,
      tokenize='unicode61'
    );
  `);

  ftsReady = true;
}

export async function indexPostInFts(post: {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  status: string;
}): Promise<void> {
  if (getDatabaseKind() !== "sqlite") return;
  if (post.status !== "PUBLISHED") {
    await removePostFromFts(post.id);
    return;
  }

  await ensurePostFtsTable();
  await removePostFromFts(post.id);

  const content = post.content ?? post.summary;

  await prisma.$executeRaw`
    INSERT INTO post_fts (post_id, title, summary, content)
    VALUES (${post.id}, ${post.title}, ${post.summary}, ${content})
  `;
}

export async function removePostFromFts(postId: string): Promise<void> {
  await ensurePostFtsTable();
  await prisma.$executeRaw`
    DELETE FROM post_fts WHERE post_id = ${postId}
  `;
}

export async function searchPostIdsByFts(
  query: string,
  limit: number
): Promise<string[]> {
  if (getDatabaseKind() !== "sqlite") return [];
  const match = buildFtsMatchQuery(query);
  if (!match) return [];

  await ensurePostFtsTable();

  try {
    const safeMatch = match.replace(/'/g, "''");
    const rows = await prisma.$queryRawUnsafe<{ post_id: string }[]>(
      `SELECT post_id FROM post_fts WHERE post_fts MATCH '${safeMatch}' ORDER BY bm25(post_fts) LIMIT ${Number(limit)}`
    );
    return rows.map((r) => r.post_id);
  } catch {
    return [];
  }
}

export async function reindexAllPostsFts(): Promise<{ indexed: number }> {
  if (getDatabaseKind() !== "sqlite") {
    return { indexed: 0 };
  }
  await ensurePostFtsTable();
  await prisma.$executeRawUnsafe(`DELETE FROM post_fts`);

  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, summary: true, content: true, status: true },
  });

  for (const post of posts) {
    await indexPostInFts(post);
  }

  return { indexed: posts.length };
}
