/**
 * Neon(프로덕션) DB — 자동 뉴스 삭제 후 필터·규칙대로 재수집
 * npx tsx scripts/news-reset-production.ts
 */
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production.pg", override: true });

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

  const before = await prisma.post.findMany({
    where: { isAutomated: true },
    select: { id: true },
  });

  const deleted = await prisma.post.deleteMany({
    where: { isAutomated: true },
  });

  console.log(
    JSON.stringify(
      {
        deleted: deleted.count,
        hadAutomated: before.length,
        naverConfigured: isNaverNewsConfigured(),
      },
      null,
      2
    )
  );

  const result = await ingestDailyNews({ ignoreDailyCap: true });
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
