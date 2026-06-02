/**
 * 일일 상한 무시 없이 수집 (오늘 10건 찼을 때) — 로컬 SQLite 권장
 * DATABASE_URL=file:./dev.db npx tsx scripts/news-ingest-continue.ts
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ingestDailyNews } from "../src/lib/news/ingest";

async function main() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const start = new Date(`${today}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const before = await prisma.post.count({
    where: { isAutomated: true, ingestedAt: { gte: start, lt: end } },
  });
  console.log(`[ingest] 호치민 오늘 기존 ${before}건 → 수집 시작…`);

  const result = await ingestDailyNews({ ignoreDailyCap: true });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
