/**
 * 글 상세 DB 경로 점검
 *
 * npm run debug:post -- <postId>              로컬 SQLite + getPostById
 * npm run debug:post -- --neon <postId>       Neon raw pg 쿼리
 * npm run debug:post -- --neon-prisma <postId> Neon Prisma getPostById 경로
 */
import { Pool } from "pg";
import {
  openNeonPrisma,
  pingNeonDb,
  readNeonDatabaseUrl,
  restoreLocalSqlitePrisma,
} from "./lib/neon-bootstrap";
import { visibleCommentWhere } from "../src/lib/moderation";

const args = process.argv.slice(2);
const neonRaw = args.includes("--neon");
const neonPrisma = args.includes("--neon-prisma");
const id =
  args.find((a) => !a.startsWith("--")) ??
  "cmqcnt4430000h4h7o4n0k0hn";

async function debugLocal(targetId: string) {
  const { prisma } = await import("../src/lib/prisma");
  const total = await prisma.post.count();
  console.log("local posts:", total);

  if (targetId) {
    const exists = await prisma.post.findUnique({
      where: { id: targetId },
      select: { id: true, title: true },
    });
    console.log(
      "id exists locally:",
      Boolean(exists),
      exists?.title?.slice(0, 40)
    );
  }

  const { getPostById } = await import("../src/lib/posts");
  const resolved =
    targetId ||
    (
      await prisma.post.findFirst({
        orderBy: { ingestedAt: "desc" },
        select: { id: true },
      })
    )?.id ||
    "";
  console.log("testing getPostById:", resolved);
  try {
    const post = await getPostById(resolved);
    console.log(
      "getPostById OK:",
      post?.title?.slice(0, 40),
      "attachments:",
      post?.attachments?.length
    );
  } catch (e) {
    console.error("getPostById THREW:");
    console.error(e);
    process.exit(1);
  }
  await prisma.$disconnect();
}

async function debugNeonRaw(targetId: string) {
  const pool = new Pool({
    connectionString: readNeonDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });

  try {
    const tables = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    console.log("tables:", tables.rows.map((r) => r.table_name).join(", "));

    for (const t of ["Post", "PostAttachment", "Comment", "Category", "User"]) {
      const ok = tables.rows.some((r) => r.table_name === t);
      console.log(`  ${ok ? "OK" : "MISSING"}: ${t}`);
    }

    const checks: Array<[string, string]> = [
      ["Post", `SELECT id FROM "Post" WHERE id=$1`],
      [
        "PostAttachment",
        `SELECT id FROM "PostAttachment" WHERE "postId"=$1 ORDER BY "sortOrder" ASC`,
      ],
      [
        "Comment",
        `SELECT id FROM "Comment" WHERE "postId"=$1 AND "isHidden"=false`,
      ],
      [
        "Category-join",
        `SELECT c.id, p.id FROM "Post" p JOIN "Category" c ON c.id=p."categoryId" WHERE p.id=$1`,
      ],
    ];
    for (const [label, sql] of checks) {
      try {
        const r = await pool.query(sql, [targetId]);
        console.log(`query OK [${label}] rows=${r.rowCount}`);
      } catch (e) {
        console.error(`query FAIL [${label}]:`, (e as Error).message);
      }
    }
  } finally {
    await pool.end();
  }
}

async function debugNeonPrisma(targetId: string) {
  const prisma = await openNeonPrisma();
  await pingNeonDb(prisma, "debug-post");

  try {
    const post = await prisma.post.findUnique({
      where: { id: targetId },
      include: {
        category: {
          include: {
            parent: { select: { label: true, href: true, slug: true } },
          },
        },
        author: { select: { id: true, name: true } },
        attachments: { orderBy: { sortOrder: "asc" } },
        comments: {
          where: visibleCommentWhere,
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });
    if (!post) {
      console.log("post not found");
      return;
    }
    console.log("OK:", {
      title: post.title.slice(0, 50),
      category: post.category.label,
      parent: post.category.parent?.label ?? null,
      attachments: post.attachments.length,
      comments: post.comments.length,
      moderationStatus: post.moderationStatus,
      publishedAt: post.publishedAt.toISOString(),
    });
    const desc = (post.content ?? post.title).replace(/\n/g, " ").slice(0, 160);
    console.log("metadata desc len:", desc.length);
  } catch (e) {
    console.error("PRISMA THREW:");
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    restoreLocalSqlitePrisma();
  }
}

async function main() {
  if (neonPrisma) {
    await debugNeonPrisma(id);
    return;
  }
  if (neonRaw) {
    await debugNeonRaw(id);
    return;
  }
  await debugLocal(id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
