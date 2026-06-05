/**
 * 썸네일 없음·Unsplash 대체만 있는 자동 뉴스 삭제
 * npm run news:prune-no-thumbnail
 */
import "dotenv/config";
import { isFallbackThumbnailUrl } from "../src/lib/news/resolve-post-thumbnail";
import { prisma } from "../src/lib/prisma";
import { removePostFromSearch } from "../src/lib/search/index-post";

async function main() {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: { id: true, title: true, thumbnail: true },
  });

  let removed = 0;
  for (const post of posts) {
    const thumb = post.thumbnail?.trim() ?? "";
    const missing = !thumb || isFallbackThumbnailUrl(thumb);
    if (!missing) continue;

    await removePostFromSearch(post.id);
    await prisma.post.delete({ where: { id: post.id } });
    removed++;
    console.log("삭제(썸네일 없음):", post.title.slice(0, 70));
  }

  console.log(JSON.stringify({ checked: posts.length, removed }, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
