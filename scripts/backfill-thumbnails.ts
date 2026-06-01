import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { getFallbackThumbnail } from "../src/lib/news/default-thumbnails";
import {
  normalizeStoredThumbnailUrl,
  resolveNewsThumbnailWithRetry,
  verifyImageAccessibleWithRetry,
} from "../src/lib/news/image";
import type { PostTopic } from "../src/generated/prisma/client";

async function main() {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: { id: true, title: true, sourceUrl: true, topic: true, thumbnail: true },
  });

  let updated = 0;
  for (const post of posts) {
    const topic = post.topic as PostTopic;
    const currentOk =
      post.thumbnail &&
      (post.thumbnail.includes("images.unsplash.com") ||
        (await verifyImageAccessibleWithRetry(post.thumbnail, post.sourceUrl)));

    if (currentOk) continue;

    let thumb: string | undefined;
    if (!/news\.google\.com/i.test(post.sourceUrl)) {
      if (post.thumbnail) {
        thumb = await normalizeStoredThumbnailUrl(
          post.thumbnail,
          post.sourceUrl
        );
      }
      if (!thumb) {
        thumb = await resolveNewsThumbnailWithRetry(post.sourceUrl, []);
        if (thumb) {
          thumb = await normalizeStoredThumbnailUrl(thumb, post.sourceUrl);
        }
      }
    }
    const finalThumb = thumb ?? getFallbackThumbnail(topic);

    await prisma.post.update({
      where: { id: post.id },
      data: { thumbnail: finalThumb },
    });
    updated++;
    console.log("OK:", post.title.slice(0, 50));
  }

  console.log(JSON.stringify({ total: posts.length, updated }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
