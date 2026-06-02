/**
 * 자동 수집 뉴스 목록 (Neon 또는 로컬 .env DATABASE_URL)
 * npx tsx scripts/list-automated-news.ts
 */
import { config } from "dotenv";

config({ path: ".env" });
config({ path: ".env.production.pg", override: process.argv.includes("--neon") });

async function main() {
  const { prisma } = await import("../src/lib/prisma");
  const posts = await prisma.post.findMany({
    where: { isAutomated: true },
    orderBy: { ingestedAt: "desc" },
    select: {
      id: true,
      title: true,
      ingestedAt: true,
      publishedAt: true,
      topic: true,
      sourceUrl: true,
    },
    take: 30,
  });
  const runs = await prisma.newsIngestRun.findMany({
    orderBy: { runAt: "desc" },
    take: 5,
  });
  console.log(
    JSON.stringify(
      {
        database: process.env.DATABASE_URL?.slice(0, 30) + "...",
        automatedCount: posts.length,
        posts: posts.map((p) => ({
          id: p.id,
          title: p.title.slice(0, 60),
          ingestedAt: p.ingestedAt.toISOString(),
          topic: p.topic,
        })),
        recentIngestRuns: runs,
      },
      null,
      2
    )
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
