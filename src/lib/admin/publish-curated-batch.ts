import { revalidatePath } from "next/cache";
import {
  publishCuratedTradePost,
  updateCuratedTradePost,
} from "@/lib/admin/publish-curated-trade";
import { areDuplicateCurateItems } from "@/lib/ai/curate-item-dedupe";
import type { CurateKakaoItem } from "@/lib/ai/curate-kakao-schemas";
import type { z } from "zod";
import type { curateKakaoPublishSchema } from "@/lib/ai/curate-kakao-schemas";
import { POST_CURATE_TYPES } from "@/lib/ai/curate-category-map";
import { PUBLISHABLE_CURATE_TYPES } from "@/lib/ai/curate-kakao-types";
import { slugifyLifeTitle } from "@/lib/life/slugify-title";
import { prisma } from "@/lib/prisma";

type PublishInput = z.infer<typeof curateKakaoPublishSchema>;

function inputToCurateItem(input: PublishInput): CurateKakaoItem {
  return {
    contentType: input.contentType,
    title: input.title,
    vnText: input.vnText,
    body: input.mergedBody ?? input.body,
    categorySlug: input.categorySlug,
    storeName: input.storeName,
    kakaoLink: input.kakaoLink,
    region: input.region,
    sourceLabel: input.sourceLabel,
    priceVnd: input.priceVnd,
    listingIntent: input.listingIntent,
    itemKind: input.itemKind,
    contactPhone: input.contactPhone,
    contactKakaoId: input.contactKakaoId,
    senderName: input.senderName,
    messageAt: input.messageAt,
  };
}

export type BatchPublishResult = {
  published: { title: string; href: string; kind: "post" | "life" }[];
  updated: { title: string; href: string; kind: "post" | "life" }[];
  skipped: { title: string; reason: string }[];
};

export async function publishCuratedItemsBatch(
  items: PublishInput[],
  authorId: string
): Promise<BatchPublishResult> {
  const published: BatchPublishResult["published"] = [];
  const updated: BatchPublishResult["updated"] = [];
  const skipped: BatchPublishResult["skipped"] = [];
  let promoTouched = false;

  for (const item of items) {
    if (!PUBLISHABLE_CURATE_TYPES.includes(item.contentType)) {
      skipped.push({ title: item.title, reason: "발행 불가 유형" });
      continue;
    }

    if (item.guideUpdateId && item.contentType === "VIETNAMESE_STUDY") {
      try {
        const body = (item.mergedBody ?? item.body).trim();
        const guide = await prisma.lifeGuide.update({
          where: { id: item.guideUpdateId },
          data: {
            title: item.title,
            vnText: item.vnText ?? undefined,
            body,
            publishedAt: new Date(),
          },
        });
        updated.push({
          title: guide.title,
          href: `/life/${guide.slug}`,
          kind: "life",
        });
      } catch (err) {
        skipped.push({
          title: item.title,
          reason: err instanceof Error ? err.message : "공부 글 업데이트 실패",
        });
      }
      continue;
    }

    if (item.updatePostId) {
      try {
        const result = await updateCuratedTradePost(item.updatePostId, {
          title: item.title,
          body: (item.mergedBody ?? item.body).trim(),
          kakaoLink: item.kakaoLink,
          region: item.region,
          imageUrl: item.imageUrl,
        });
        if (item.contentType === "PROMO") promoTouched = true;
        updated.push({
          title: item.title,
          href: result.href,
          kind: "post",
        });
      } catch (err) {
        skipped.push({
          title: item.title,
          reason: err instanceof Error ? err.message : "업데이트 실패",
        });
      }
      continue;
    }
  }

  const createQueue = items.filter(
    (i) => !i.updatePostId && !i.guideUpdateId
  );

  for (const item of createQueue) {
    if (!PUBLISHABLE_CURATE_TYPES.includes(item.contentType)) continue;
    if (item.contentType === "PROMO" && !item.storeName?.trim()) continue;

    if (
      createQueue
        .filter((p) => p !== item)
        .some((p) =>
          areDuplicateCurateItems(inputToCurateItem(p), inputToCurateItem(item))
        )
    ) {
      skipped.push({ title: item.title, reason: "이번 일괄 발행 안에서 중복" });
      continue;
    }

    if (item.contentType === "VIETNAMESE_STUDY") {
      const slug = item.slug ?? slugifyLifeTitle(item.title);
      const existing = await prisma.lifeGuide.findUnique({ where: { slug } });
      if (existing) {
        skipped.push({ title: item.title, reason: "slug 중복" });
        continue;
      }

      const guide = await prisma.lifeGuide.create({
        data: {
          slug,
          kind: "PHRASE",
          domain: "STUDY",
          title: item.title,
          vnText: item.vnText ?? null,
          body: item.body,
          imageUrl: item.imageUrl ?? null,
          sourceLabel: item.sourceLabel ?? "카톡 단톡방",
          isCrawl: item.isCrawl,
        },
      });

      published.push({
        title: item.title,
        href: `/life/${guide.slug}`,
        kind: "life",
      });
      continue;
    }

    if (!POST_CURATE_TYPES.includes(item.contentType)) {
      skipped.push({ title: item.title, reason: "지원하지 않는 유형" });
      continue;
    }

    try {
      const result = await publishCuratedTradePost({
        title: item.title,
        body: item.body,
        contentType: item.contentType,
        categorySlug: item.categorySlug,
        authorId,
        imageUrl: item.imageUrl,
        storeName: item.storeName,
        kakaoLink: item.kakaoLink,
        region: item.region,
        sourceLabel: item.sourceLabel,
        isCrawl: item.isCrawl,
        rawItem: inputToCurateItem(item),
      });

      if (item.contentType === "PROMO") promoTouched = true;

      published.push({
        title: item.title,
        href: result.href,
        kind: "post",
      });
    } catch (err) {
      skipped.push({
        title: item.title,
        reason: err instanceof Error ? err.message : "발행 실패",
      });
    }
  }

  if (promoTouched) {
    revalidatePath("/promo");
  }

  return { published, updated, skipped };
}
