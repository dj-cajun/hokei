/**
 * 자동 수집 뉴스 전량 삭제 후 네이버·RSS로 재수집
 * npm run news:reset
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ingestDailyNews } from "../src/lib/news/ingest";
import { isNaverNewsConfigured } from "../src/lib/news/naver-news";

async function main() {
  const before = await prisma.post.findMany({
    where: { isAutomated: true },
    select: { id: true, sourceUrl: true },
  });
  const googleCount = before.filter((p) =>
    /news\.google\.com/i.test(p.sourceUrl)
  ).length;

  const deleted = await prisma.post.deleteMany({
    where: { isAutomated: true },
  });

  console.log(
    JSON.stringify(
      {
        deleted: deleted.count,
        googleUrls: googleCount,
        naverConfigured: isNaverNewsConfigured(),
      },
      null,
      2
    )
  );

  if (!isNaverNewsConfigured()) {
    console.warn(
      "⚠ NAVER_CLIENT_ID / NAVER_CLIENT_SECRET이 비어 있습니다. 네이버 뉴스는 수집되지 않고 VnExpress RSS만 시도합니다."
    );
  }

  const result = await ingestDailyNews({ ignoreDailyCap: true });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
