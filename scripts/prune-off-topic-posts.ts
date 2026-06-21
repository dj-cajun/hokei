/**
 * 주제 필터 기준 오프토픽 자동 뉴스 삭제
 * npm run news:prune-off-topic
 */
import { loadDotenv } from "../src/lib/load-dotenv";

loadDotenv();

import { passesTopicRelevanceFilter } from "../src/lib/news/topic-relevance";
import { removePostFromSearch } from "../src/lib/search/index-post";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
  const useNeon = process.argv.includes("--neon");
  if (useNeon) {
    const { openNeonPrisma, restoreLocalSqlitePrisma } = await import(
      "./lib/neon-bootstrap"
    );
    await openNeonPrisma();
    try {
      await prune();
    } finally {
      restoreLocalSqlitePrisma();
    }
    return;
  }
  await prune();
}

async function prune() {
  const { prisma } = await import("../src/lib/prisma");

  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      originalTitle: true,
      content: true,
      topic: true,
      sourceUrl: true,
      sourceName: true,
    },
  });

  let removed = 0;
  for (const post of posts) {
    const titleForMatch = post.originalTitle ?? post.title;
    const ok = passesTopicRelevanceFilter(
      post.topic as PostTopic,
      titleForMatch,
      post.content ?? "",
      { link: post.sourceUrl, sourceName: post.sourceName ?? "" }
    );
    if (ok) continue;

    await removePostFromSearch(post.id);
    await prisma.post.delete({ where: { id: post.id } });
    removed++;
    console.log("삭제:", post.title.slice(0, 70));
  }

  console.log(JSON.stringify({ checked: posts.length, removed }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
