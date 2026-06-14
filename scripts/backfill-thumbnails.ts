/**
 * 자동 뉴스 썸네일 일괄 보정
 * - 기사 이미지 있음 → URL 재연결·검증
 * - 없음 → 토픽별 대체 이미지
 * npm run news:backfill-thumbnails
 * npm run news:backfill-thumbnails -- --neon   (Neon/프로덕션 DB)
 * npm run news:backfill-thumbnails -- --neon --missing-only   (누락·깨진 것만)
 * npm run news:backfill-thumbnails -- --neon --stats   (통계만)
 */
import {
  openNeonPrisma,
  pingNeonDb,
  restoreLocalSqlitePrisma,
} from "./lib/neon-bootstrap";
import { loadDotenv } from "../src/lib/load-dotenv";
import { fetchArticleBody } from "../src/lib/news/article-body";
import {
  getFallbackThumbnail,
  isFallbackThumbnailUrl,
  isStaticFallbackThumbnailPath,
} from "../src/lib/news/default-thumbnails";
import {
  isWorkingArticleThumbnail,
  resolveAutomatedNewsThumbnail,
} from "../src/lib/news/resolve-post-thumbnail";
import {
  isNewsThumbnailBlobUrl,
  persistNewsThumbnailToBlob,
} from "../src/lib/news/persist-thumbnail-blob";
import { isBlobStorageEnabled } from "../src/lib/upload-blob";
import type { PostTopic } from "../src/generated/prisma/client";
import type { PrismaClient } from "../src/generated/prisma/client";

function needsThumbnailFix(
  thumbnail: string | null | undefined,
  missingOnly: boolean
): boolean {
  if (!missingOnly) return true;
  const t = thumbnail?.trim() ?? "";
  if (!t) return true;
  if (isNewsThumbnailBlobUrl(t)) return false;
  if (isStaticFallbackThumbnailPath(t)) return false;
  if (isFallbackThumbnailUrl(t) && !isStaticFallbackThumbnailPath(t)) return true;
  if (t.includes("vnecdn")) return true;
  return false;
}

async function printThumbnailStats(prisma: PrismaClient): Promise<void> {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: { title: true, thumbnail: true },
  });

  let empty = 0;
  let blob = 0;
  let fallback = 0;
  let external = 0;
  const missing: string[] = [];

  for (const p of posts) {
    const t = p.thumbnail?.trim() ?? "";
    if (!t) {
      empty++;
      missing.push(p.title.slice(0, 50));
    } else if (isNewsThumbnailBlobUrl(t)) blob++;
    else if (isFallbackThumbnailUrl(t)) {
      fallback++;
      missing.push(p.title.slice(0, 50));
    } else external++;
  }

  console.log(
    JSON.stringify(
      { total: posts.length, empty, blob, fallback, external },
      null,
      2
    )
  );
  if (missing.length) {
    console.log("needs fix:", missing.slice(0, 10).join("\n"));
  }
}

async function bootstrapPrisma(
  useNeon: boolean,
  skipGenerate: boolean
): Promise<PrismaClient> {
  if (useNeon) {
    const prisma = await openNeonPrisma({ skipGenerate });
    await pingNeonDb(prisma, "backfill");
    return prisma;
  }
  loadDotenv();
  const { prisma } = await import("../src/lib/prisma");
  return prisma;
}

async function main() {
  const useNeon = process.argv.includes("--neon");
  const missingOnly = process.argv.includes("--missing-only");
  const skipGenerate = process.argv.includes("--skip-generate");
  const statsOnly = process.argv.includes("--stats");
  const prisma = await bootstrapPrisma(useNeon, skipGenerate);

  if (statsOnly) {
    console.log(`[backfill] stats target=${useNeon ? "neon" : "local"}`);
    await printThumbnailStats(prisma);
    await prisma.$disconnect();
    if (useNeon && !skipGenerate) restoreLocalSqlitePrisma();
    return;
  }

  console.log(
    `[backfill] target=${useNeon ? "neon" : "local"} missingOnly=${missingOnly} skipGenerate=${skipGenerate}`
  );

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
  let blobCopied = 0;
  let fallbackOnly = 0;
  let skipped = 0;

  for (const post of posts) {
    if (!needsThumbnailFix(post.thumbnail, missingOnly)) {
      skipped++;
      continue;
    }

    const topic = post.topic as PostTopic;

    if (
      isFallbackThumbnailUrl(post.thumbnail) &&
      !isStaticFallbackThumbnailPath(post.thumbnail)
    ) {
      const thumb = getFallbackThumbnail(topic);
      await prisma.post.update({
        where: { id: post.id },
        data: { thumbnail: thumb },
      });
      updated++;
      fallbackOnly++;
      console.log("폴백→정적:", post.title.slice(0, 56));
      continue;
    }

    if (!post.thumbnail?.trim() || isFallbackThumbnailUrl(post.thumbnail)) {
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
      if (isFallbackThumbnailUrl(thumb)) fallbackOnly++;
      console.log("복구:", post.title.slice(0, 56));
      continue;
    }

    const isBrokenVnecdn =
      post.thumbnail.includes("vnecdn") && !isNewsThumbnailBlobUrl(post.thumbnail);
    if (isBrokenVnecdn) {
      const article = await fetchArticleBody(post.sourceUrl);
      const thumb = await resolveAutomatedNewsThumbnail({
        topic,
        link: post.sourceUrl,
        scrapedImg: article?.img,
        existingThumbnail: post.thumbnail,
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { thumbnail: thumb },
      });
      updated++;
      if (isFallbackThumbnailUrl(thumb)) fallbackOnly++;
      console.log("vnecdn→복구:", post.title.slice(0, 56));
      continue;
    }

    if (
      isBlobStorageEnabled() &&
      post.thumbnail &&
      !isFallbackThumbnailUrl(post.thumbnail) &&
      !isNewsThumbnailBlobUrl(post.thumbnail)
    ) {
      const blobUrl = await persistNewsThumbnailToBlob(
        post.thumbnail,
        post.sourceUrl
      );
      if (blobUrl && blobUrl !== post.thumbnail) {
        await prisma.post.update({
          where: { id: post.id },
          data: { thumbnail: blobUrl },
        });
        blobCopied++;
        console.log("Blob:", post.title.slice(0, 56));
        continue;
      }
    }

    if (isNewsThumbnailBlobUrl(post.thumbnail)) {
      kept++;
      continue;
    }

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
    if (isFallbackThumbnailUrl(thumb)) fallbackOnly++;

    console.log("OK:", post.title.slice(0, 56));
  }

  console.log(
    JSON.stringify(
      { total: posts.length, skipped, kept, updated, blobCopied, fallbackOnly },
      null,
      2
    )
  );
  await prisma.$disconnect();

  if (useNeon && !skipGenerate) {
    restoreLocalSqlitePrisma();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
