/**
 * 로컬/CI에서 뉴스 수집 수동 실행
 * npm run news:ingest
 */
import { loadDotenv } from "../src/lib/load-dotenv";

loadDotenv();

import { prisma } from "../src/lib/prisma";

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
