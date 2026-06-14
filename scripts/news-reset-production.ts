/**
 * Neon(프로덕션) DB — 뉴스 수집 (RSS 우회, 네이버 API 불필요)
 *
 * npm run news:reset:neon           — 기존 글 유지, 추가 수집
 * npm run news:reset:neon -- --full — 일일 상한 무시 추가 수집
 * npm run news:reset:neon -- --purge — 전량 삭제 후 재수집 (주의)
 */
import {
  clearPrismaModuleCache,
  openNeonPrisma,
  pingNeonDb,
  restoreLocalSqlitePrisma,
} from "./lib/neon-bootstrap";

const purge = process.argv.includes("--purge");
const full = process.argv.includes("--full") || purge;
const keepPg = process.argv.includes("--keep-pg");

async function main() {
  console.log("[neon-reset] PostgreSQL 대상 수집 시작…");

  const prisma = await openNeonPrisma();
  await pingNeonDb(prisma, "neon-reset");

  clearPrismaModuleCache();
  const { ingestDailyNews } = await import("../src/lib/news/ingest");
  const { isNaverNewsConfigured } = await import("../src/lib/news/naver-news");

  if (purge) {
    const before = await prisma.post.count({ where: { isAutomated: true } });
    const deleted = await prisma.post.deleteMany({
      where: { isAutomated: true },
    });
    console.log(
      JSON.stringify(
        {
          purge: true,
          deleted: deleted.count,
          hadAutomated: before,
          naverConfigured: isNaverNewsConfigured(),
        },
        null,
        2
      )
    );
  } else {
    const kept = await prisma.post.count({ where: { isAutomated: true } });
    console.log(JSON.stringify({ purge: false, keptAutomated: kept }, null, 2));
  }

  console.log("[neon-reset] 뉴스 수집 시작…");
  const result = await ingestDailyNews({
    ignoreDailyCap: full,
    triggeredBy: "manual-neon",
  });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();

  if (keepPg) {
    console.log("[neon-reset] --keep-pg: PostgreSQL Client 유지 (다음 Neon 단계용)");
  } else {
    restoreLocalSqlitePrisma();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
