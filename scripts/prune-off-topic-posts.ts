import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { passesTopicRelevanceFilter } from "../src/lib/news/topic-relevance";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
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
