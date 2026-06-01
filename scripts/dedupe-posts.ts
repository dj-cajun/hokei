/**
 * 같은 내용 자동 뉴스 중복 삭제 (최신·본문 긴 글 1건만 유지)
 * npm run news:dedupe
 */
import "dotenv/config";
import {
  findDuplicateClusters,
  pickKeeperPost,
} from "../src/lib/news/dedupe";
import { prisma } from "../src/lib/prisma";

async function main() {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      content: true,
      views: true,
      publishedAt: true,
    },
    orderBy: { publishedAt: "desc" },
  });

  const clusters = findDuplicateClusters(posts);
  const toDelete: string[] = [];

  for (const cluster of clusters) {
    const keeper = pickKeeperPost(cluster);
    for (const p of cluster) {
      if (p.id !== keeper.id) {
        toDelete.push(p.id);
        console.log("삭제:", p.title.slice(0, 55));
        console.log("  유지:", keeper.title.slice(0, 55));
      }
    }
  }

  if (toDelete.length > 0) {
    await prisma.post.deleteMany({ where: { id: { in: toDelete } } });
  }

  console.log(
    JSON.stringify(
      {
        total: posts.length,
        duplicateGroups: clusters.length,
        removed: toDelete.length,
        remaining: posts.length - toDelete.length,
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
