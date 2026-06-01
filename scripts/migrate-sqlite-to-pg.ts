/**
 * SQLite dev.db → PostgreSQL 데이터 이전 (Post·Comment·User·Category)
 * npm run db:migrate:sqlite-to-pg
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const sqliteUrl = process.env.SQLITE_DATABASE_URL ?? "file:./dev.db";
const pgUrl = process.env.DATABASE_URL ?? "";

if (!pgUrl.startsWith("postgresql://") && !pgUrl.startsWith("postgres://")) {
  console.error(
    "[migrate] DATABASE_URL을 PostgreSQL로 설정한 뒤 실행하세요."
  );
  process.exit(1);
}

const sqlite = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: sqliteUrl }),
});
const pg = createPostgresPrisma(pgUrl);

async function main() {
  const [users, categories, posts, comments, attachments] = await Promise.all([
    sqlite.user.findMany(),
    sqlite.category.findMany({ orderBy: { sortOrder: "asc" } }),
    sqlite.post.findMany(),
    sqlite.comment.findMany(),
    sqlite.postAttachment.findMany(),
  ]);

  console.log(
    `[migrate] SQLite → PG: users ${users.length}, categories ${categories.length}, posts ${posts.length}`
  );

  for (const u of users) {
    await pg.user.upsert({
      where: { email: u.email },
      create: u,
      update: {
        name: u.name,
        password: u.password,
        role: u.role,
      },
    });
  }

  const catIdMap = new Map<string, string>();
  for (const c of categories.filter((x) => !x.parentId)) {
    const row = await pg.category.upsert({
      where: { slug: c.slug },
      create: {
        id: c.id,
        slug: c.slug,
        label: c.label,
        description: c.description,
        icon: c.icon,
        colorClass: c.colorClass,
        href: c.href,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
      },
      update: {},
    });
    catIdMap.set(c.id, row.id);
  }
  for (const c of categories.filter((x) => x.parentId)) {
    const parentId = catIdMap.get(c.parentId!) ?? c.parentId!;
    const row = await pg.category.upsert({
      where: { slug: c.slug },
      create: {
        id: c.id,
        slug: c.slug,
        label: c.label,
        description: c.description,
        icon: c.icon,
        colorClass: c.colorClass,
        href: c.href,
        sortOrder: c.sortOrder,
        isActive: c.isActive,
        parentId,
      },
      update: { parentId },
    });
    catIdMap.set(c.id, row.id);
  }

  for (const p of posts) {
    await pg.post.upsert({
      where: { sourceUrl: p.sourceUrl },
      create: {
        ...p,
        categoryId: catIdMap.get(p.categoryId) ?? p.categoryId,
      },
      update: {
        title: p.title,
        summary: p.summary,
        content: p.content,
        views: p.views,
        commentCount: p.commentCount,
        status: p.status,
      },
    });
  }

  for (const a of attachments) {
    await pg.postAttachment.upsert({
      where: { id: a.id },
      create: a,
      update: a,
    });
  }

  for (const c of comments) {
    await pg.comment.upsert({
      where: { id: c.id },
      create: c,
      update: { content: c.content },
    });
  }

  console.log("[migrate] 완료 — npm run search:pg:setup 권장");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await sqlite.$disconnect();
    await pg.$disconnect();
  });
