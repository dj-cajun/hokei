/**
 * Neon(프로덕션) DB — 뉴스 수집
 *
 * npm run news:reset:neon           — 기존 글 유지, 추가 수집
 * npm run news:reset:neon -- --purge — 전량 삭제 후 재수집 (주의)
 */
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production.pg", override: true });

const purge = process.argv.includes("--purge");

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    console.error("[neon-reset] DATABASE_URL이 PostgreSQL이 아닙니다.");
    process.exit(1);
  }
  console.log("[neon-reset] PostgreSQL 대상 수집 시작…");

  process.env.PRISMA_SCHEMA = "prisma/schema.postgresql.prisma";
  const { spawnSync } = await import("child_process");
  const gen = spawnSync("npx", ["prisma", "generate"], {
    stdio: "inherit",
    env: process.env,
  });
  if (gen.status !== 0) process.exit(gen.status ?? 1);

  const { prisma } = await import("../src/lib/prisma");
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
    console.log(
      JSON.stringify({ purge: false, keptAutomated: kept }, null, 2)
    );
  }

  const result = await ingestDailyNews({ ignoreDailyCap: purge });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
