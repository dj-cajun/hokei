/**
 * JSON 스냅샷 → PostgreSQL (2단계)
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { spawnSync } from "child_process";

const pgUrl = process.env.DATABASE_URL ?? "";
const inPath = process.env.MIGRATE_SNAPSHOT ?? ".migrate-sqlite-snapshot.json";

if (!pgUrl.startsWith("postgresql://") && !pgUrl.startsWith("postgres://")) {
  console.error("[migrate:import] DATABASE_URL(PostgreSQL) 필요");
  process.exit(1);
}

spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: {
    ...process.env,
    PRISMA_SCHEMA: "prisma/schema.postgresql.prisma",
    DATABASE_URL: pgUrl,
  },
});

type Cat = {
  id: string;
  slug: string;
  label: string;
  description: string;
  icon: string;
  colorClass: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
};

async function main(): Promise<void> {
  const { createPostgresPrisma } = await import("../src/lib/prisma-pg.js");
  const raw = JSON.parse(readFileSync(inPath, "utf8")) as {
    users: Array<{
      email: string;
      name: string;
      password: string | null;
      role: string;
      id: string;
      createdAt: string;
      updatedAt: string;
    }>;
    categories: Cat[];
    posts: Array<Record<string, unknown> & { sourceUrl: string; categoryId: string }>;
    comments: Array<Record<string, unknown> & { id: string }>;
    attachments: Array<Record<string, unknown> & { id: string }>;
  };

  const pg = createPostgresPrisma(pgUrl);
  const { users, categories, posts, comments, attachments } = raw;

  console.log(
    `[migrate:import] users ${users.length}, categories ${categories.length}, posts ${posts.length}`
  );

  for (const u of users) {
    await pg.user.upsert({
      where: { email: u.email },
      create: {
        id: u.id,
        email: u.email,
        name: u.name,
        password: u.password ?? "",
        role: u.role as "USER" | "ADMIN",
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
      update: {
        name: u.name,
        password: u.password,
        role: u.role as "USER" | "ADMIN",
      },
    });
  }

  const catIdMap = new Map<string, string>();
  for (const c of categories.filter((x) => !x.parentId)) {
    const row = await pg.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: {},
    });
    catIdMap.set(c.id, row.id);
  }
  for (const c of categories.filter((x) => x.parentId)) {
    const parentId = catIdMap.get(c.parentId!) ?? c.parentId!;
    const row = await pg.category.upsert({
      where: { slug: c.slug },
      create: { ...c, parentId },
      update: { parentId },
    });
    catIdMap.set(c.id, row.id);
  }

  for (const p of posts) {
    const { categoryId, ...rest } = p;
    await pg.post.upsert({
      where: { sourceUrl: p.sourceUrl },
      create: {
        ...(rest as Omit<typeof rest, "categoryId">),
        categoryId: catIdMap.get(categoryId as string) ?? (categoryId as string),
        publishedAt: new Date(p.publishedAt as string),
        ingestedAt: new Date(p.ingestedAt as string),
        createdAt: new Date(p.createdAt as string),
        updatedAt: new Date(p.updatedAt as string),
      } as never,
      update: {
        title: p.title as string,
        summary: p.summary as string,
        content: p.content as string | null,
        views: p.views as number,
        commentCount: p.commentCount as number,
        status: p.status as "PUBLISHED" | "DRAFT",
      },
    });
  }

  for (const a of attachments) {
    await pg.postAttachment.upsert({
      where: { id: a.id },
      create: {
        ...a,
        createdAt: new Date(a.createdAt as string),
      } as never,
      update: a as never,
    });
  }

  for (const c of comments) {
    await pg.comment.upsert({
      where: { id: c.id },
      create: {
        ...c,
        createdAt: new Date(c.createdAt as string),
      } as never,
      update: { content: c.content as string },
    });
  }

  await pg.$disconnect();
  console.log("[migrate:import] 완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
