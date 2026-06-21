/**
 * 프로덕션 Neon DB 대상 뉴스 수집
 * npm run news:ingest -- --neon  (package.json alias below)
 * npx tsx scripts/news-ingest-neon.ts
 */
import {
  openNeonPrisma,
  restoreLocalSqlitePrisma,
} from "./lib/neon-bootstrap";
import { loadDotenv } from "../src/lib/load-dotenv";

loadDotenv();

async function main() {
  await openNeonPrisma();
  const { ingestDailyNews } = await import("../src/lib/news/ingest");
  const { prisma } = await import("../src/lib/prisma");

  console.log("[ingest-neon] 프로덕션 DB 수집 시작…");
  const result = await ingestDailyNews({ triggeredBy: "manual-cli-neon" });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await restoreLocalSqlitePrisma();
  });
