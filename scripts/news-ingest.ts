/**
 * 로컬/CI에서 뉴스 수집 수동 실행
 * npm run news:ingest
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

process.env.DATABASE_URL ??= "file:./dev.db";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const { ingestDailyNews } = await import("../src/lib/news/ingest");
  const result = await ingestDailyNews();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
