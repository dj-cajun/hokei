/**
 * Neon 등 Postgres — NewsSourceConfig 시드
 * DATABASE_URL=postgresql://... npx tsx scripts/seed-news-sources-prod.ts
 */
import { syncNewsSourcesFromCode } from "../src/lib/news/seed-sources-config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const added = await syncNewsSourcesFromCode();
  const total = await prisma.newsSourceConfig.count();
  console.log(JSON.stringify({ added, total }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
