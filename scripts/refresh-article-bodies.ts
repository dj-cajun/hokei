/**
 * 기존 자동 뉴스 — 원문 페이지에서 본문만 다시 수집
 * npm run news:refresh-bodies
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { buildPostFromArticlePage } from "../src/lib/news/ingest-article";
import { sanitizeStoredSourceName } from "../src/lib/news/source-display";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    orderBy: { ingestedAt: "desc" },
    include: { category: { select: { label: true, colorClass: true } } },
  });

  let updated = 0;
  let empty = 0;

  for (const post of posts) {
    const { title, content, thumbnail } = await buildPostFromArticlePage({
      topic: post.topic as PostTopic,
      title: post.originalTitle ?? post.title,
      link: post.sourceUrl,
      sourceName: post.sourceName ?? "뉴스",
      thumbnail: post.thumbnail ?? undefined,
    });

    await prisma.post.update({
      where: { id: post.id },
      data: {
        title,
        content,
        thumbnail,
        sourceName: sanitizeStoredSourceName(post.sourceName),
      },
    });

    if (content) {
      updated++;
      console.log("OK:", title.slice(0, 55));
    } else {
      empty++;
      console.log("본문 없음:", title.slice(0, 55));
    }
  }

  console.log(
    JSON.stringify({ total: posts.length, withBody: updated, noBody: empty }, null, 2)
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
