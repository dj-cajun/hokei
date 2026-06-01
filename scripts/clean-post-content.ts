/**
 * DB에 저장된 본문·sourceName에서 네이버/VnExpress/(스크래핑) 잔여 제거
 * npm run news:clean-content
 */
import "dotenv/config";
import { cleanArticleBody } from "../src/lib/news/article-body-clean";
import { sanitizeStoredSourceName } from "../src/lib/news/source-display";
import { prisma } from "../src/lib/prisma";

async function main() {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true },
    select: { id: true, title: true, content: true, sourceName: true },
  });

  let updated = 0;
  for (const post of posts) {
    const content = post.content ? cleanArticleBody(post.content) : null;
    const sourceName = sanitizeStoredSourceName(post.sourceName);
    const changed =
      content !== post.content ||
      sourceName !== (post.sourceName ?? null);

    if (!changed) continue;

    await prisma.post.update({
      where: { id: post.id },
      data: { content, sourceName },
    });
    updated++;
    console.log("정리:", post.title.slice(0, 50));
  }

  console.log(JSON.stringify({ total: posts.length, updated }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
