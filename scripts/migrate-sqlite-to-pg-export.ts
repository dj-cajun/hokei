/**
 * SQLite → JSON 스냅샷 (1단계)
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { spawnSync } from "child_process";
import { createRequire } from "module";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const require = createRequire(import.meta.url);
const sqliteUrl = process.env.SQLITE_DATABASE_URL ?? "file:./dev.db";
const outPath = process.env.MIGRATE_SNAPSHOT ?? ".migrate-sqlite-snapshot.json";

spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: { ...process.env, PRISMA_SCHEMA: "prisma/schema.prisma", DATABASE_URL: sqliteUrl },
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma/client");
const sqlite = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: sqliteUrl }),
});

async function main() {
  const [users, categories, posts, comments, attachments] = await Promise.all([
    sqlite.user.findMany(),
    sqlite.category.findMany({ orderBy: { sortOrder: "asc" } }),
    sqlite.post.findMany(),
    sqlite.comment.findMany(),
    sqlite.postAttachment.findMany(),
  ]);
  await sqlite.$disconnect();

  writeFileSync(
    outPath,
    JSON.stringify({ users, categories, posts, comments, attachments }, null, 0)
  );
  console.log(`[migrate:export] ${outPath} — posts ${posts.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
