/**
 * 자동 뉴스 categoryId를 resolveNewsCategorySlug 기준으로 재분류
 * bash scripts/with-pg-env.sh npx tsx scripts/reclassify-news-categories.ts
 */
import "dotenv/config";
import { resolveNewsCategorySlug } from "../src/lib/news/resolve-news-category";
import { prisma } from "../src/lib/prisma";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ slug: "news" }, { slug: { startsWith: "news-" } }],
    },
    select: { id: true, slug: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      summary: true,
      topic: true,
      sourceName: true,
      categoryId: true,
      category: { select: { slug: true } },
    },
  });

  let moved = 0;
  let unchanged = 0;

  for (const post of posts) {
    const slug = resolveNewsCategorySlug({
      topic: post.topic as PostTopic,
      title: post.title,
      summary: post.summary ?? undefined,
      sourceName: post.sourceName ?? undefined,
    });
    const nextId = categoryMap.get(slug) ?? categoryMap.get("news");
    if (!nextId || nextId === post.categoryId) {
      unchanged++;
      continue;
    }
    await prisma.post.update({
      where: { id: post.id },
      data: { categoryId: nextId },
    });
    moved++;
    console.log(
      `${post.category.slug} → ${slug}: ${post.title.slice(0, 50)}`
    );
  }

  console.log(
    JSON.stringify({ total: posts.length, moved, unchanged }, null, 2)
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
