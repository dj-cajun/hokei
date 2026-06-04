/**
 * 자동 뉴스 썸네일 일괄 보정
 * - 기사 이미지 있음 → URL 재연결·검증
 * - 없음 → 토픽별 대체 이미지
 * npm run news:backfill-thumbnails
 */
import "dotenv/config";
import { fetchArticleBody } from "../src/lib/news/article-body";
import {
  isWorkingArticleThumbnail,
  resolveAutomatedNewsThumbnail,
} from "../src/lib/news/resolve-post-thumbnail";
import { prisma } from "../src/lib/prisma";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      sourceUrl: true,
      topic: true,
      thumbnail: true,
    },
  });

  let kept = 0;
  let updated = 0;
  let fallbackOnly = 0;

  for (const post of posts) {
    const topic = post.topic as PostTopic;

    if (await isWorkingArticleThumbnail(post.thumbnail, post.sourceUrl)) {
      kept++;
      continue;
    }

    if (/news\.google\.com/i.test(post.sourceUrl)) {
      const thumb = await resolveAutomatedNewsThumbnail({
        topic,
        link: post.sourceUrl,
        existingThumbnail: post.thumbnail,
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { thumbnail: thumb },
      });
      updated++;
      continue;
    }

    const article = await fetchArticleBody(post.sourceUrl);
    const thumb = await resolveAutomatedNewsThumbnail({
      topic,
      link: post.sourceUrl,
      scrapedImg: article?.img,
      rssThumbnail: post.thumbnail ?? undefined,
      existingThumbnail: post.thumbnail,
    });

    await prisma.post.update({
      where: { id: post.id },
      data: { thumbnail: thumb },
    });
    updated++;
    if (thumb.includes("images.unsplash.com")) fallbackOnly++;

    console.log("OK:", post.title.slice(0, 56));
  }

  console.log(
    JSON.stringify(
      { total: posts.length, kept, updated, fallbackOnly },
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
