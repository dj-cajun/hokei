/**
 * [시론] 등 사설·시론 칼럼 자동 뉴스 삭제
 * npm run news:prune-opinion
 * npm run news:prune-opinion -- --dry-run
 */
import { loadDotenv } from "../src/lib/load-dotenv";

loadDotenv();

import { isOffTopicOpinionNews } from "../src/lib/news/off-topic-opinion-news";
import { removePostFromSearch } from "../src/lib/search/index-post";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const useNeon = process.argv.includes("--neon");

  if (useNeon) {
    const { openNeonPrisma, restoreLocalSqlitePrisma } = await import(
      "./lib/neon-bootstrap"
    );
    await openNeonPrisma();
    try {
      await prune(dryRun);
    } finally {
      restoreLocalSqlitePrisma();
    }
    return;
  }

  await prune(dryRun);
}

async function prune(dryRun: boolean) {
  const { prisma } = await import("../src/lib/prisma");

  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      originalTitle: true,
      content: true,
      summary: true,
    },
  });

  let removed = 0;
  for (const post of posts) {
    const title = post.originalTitle ?? post.title;
    const body = post.content ?? post.summary ?? "";
    if (!isOffTopicOpinionNews(title, body)) continue;

    if (dryRun) {
      console.log("[dry-run] 삭제 대상:", post.title.slice(0, 80));
      removed++;
      continue;
    }

    await removePostFromSearch(post.id);
    await prisma.post.delete({ where: { id: post.id } });
    removed++;
    console.log("삭제:", post.title.slice(0, 80));
  }

  console.log(
    JSON.stringify({ checked: posts.length, removed, dryRun }, null, 2)
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
