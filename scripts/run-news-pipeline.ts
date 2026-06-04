/**
 * 뉴스 수집(필터 포함) + 썸네일 보정 한 번에 실행
 * DATABASE_URL=postgresql://... npm run news:pipeline
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const { ingestDailyNews } = await import("../src/lib/news/ingest");
  console.log("[news:pipeline] ingest …");
  const ingest = await ingestDailyNews({ triggeredBy: "pipeline" });
  console.log(JSON.stringify({ ingest }, null, 2));

  console.log("[news:pipeline] backfill thumbnails …");
  const { execSync } = await import("child_process");
  execSync("npx tsx scripts/backfill-thumbnails.ts", {
    stdio: "inherit",
    env: process.env,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
