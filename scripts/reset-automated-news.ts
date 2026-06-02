/**
 * 뉴스 수집 (기본: 기존 글 유지, 신규만 추가)
 *
 * npm run news:reset              — 오늘 상한까지 추가 수집 (삭제 없음)
 * npm run news:reset -- --purge   — 자동 수집 글 전부 삭제 후 재수집 (주의)
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ingestDailyNews } from "../src/lib/news/ingest";
import {
  isNaverRequestsScraperAvailable,
  isNaverScraperAvailable,
} from "../src/lib/news/naver-scrape";
import { isNaverNewsConfigured } from "../src/lib/news/naver-news";

const purge = process.argv.includes("--purge");

async function main() {
  let deleted = 0;
  if (purge) {
    const before = await prisma.post.findMany({
      where: { isAutomated: true },
      select: { id: true, sourceUrl: true },
    });
    const googleCount = before.filter((p) =>
      /news\.google\.com/i.test(p.sourceUrl)
    ).length;
    const res = await prisma.post.deleteMany({
      where: { isAutomated: true },
    });
    deleted = res.count;
    console.log(
      JSON.stringify({ purge: true, deleted, googleUrls: googleCount }, null, 2)
    );
  } else {
    const kept = await prisma.post.count({ where: { isAutomated: true } });
    console.log(
      JSON.stringify(
        {
          purge: false,
          keptAutomated: kept,
          hint: "기존 뉴스 유지. 전부 지우려면 npm run news:reset -- --purge",
        },
        null,
        2
      )
    );
  }

  const scraperOk =
    (await isNaverRequestsScraperAvailable()) ||
    (await isNaverScraperAvailable());
  if (!isNaverNewsConfigured() && !scraperOk) {
    console.warn(
      "⚠ 네이버 API·스크래퍼 없음 — VnExpress RSS만 시도합니다. pip3 install -r scripts/python/requirements.txt"
    );
  }

  const result = await ingestDailyNews({
    ignoreDailyCap: purge,
  });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
