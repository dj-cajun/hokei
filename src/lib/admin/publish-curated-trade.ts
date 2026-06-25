import { revalidatePath } from "next/cache";
import type { PostTopic } from "@/generated/prisma/client";
import { buildAiCurateSourceUrl } from "@/lib/ai-curate-source";
import type { CurateKakaoContentType } from "@/lib/ai/curate-kakao-types";
import { resolveCurateCategorySlug } from "@/lib/ai/curate-category-map";
import {
  enrichCurateBody,
  enrichCurateTitle,
} from "@/lib/admin/format-curated-post";
import type { CurateKakaoItem } from "@/lib/ai/curate-kakao-schemas";
import { prisma } from "@/lib/prisma";
import { revalidatePostCaches } from "@/lib/revalidate-content";
import { indexPostInSearch } from "@/lib/search/index-post";
import { getRootSectionSlug } from "@/lib/category-tree";
import { promoStoreTimelineHref } from "@/lib/site-navigation";

export type PublishCuratedTradeInput = {
  title: string;
  body: string;
  contentType: CurateKakaoContentType;
  categorySlug?: string | null;
  authorId: string;
  imageUrl?: string | null;
  storeName?: string | null;
  kakaoLink?: string | null;
  region?: string | null;
  sourceLabel?: string | null;
  isCrawl?: boolean;
  /** enrichCurateBody 적용 전 원본 (이미 적용됐으면 생략) */
  rawItem?: CurateKakaoItem;
};

function topicForSection(sectionSlug: string): PostTopic {
  if (sectionSlug === "real-estate") return "TRAVEL";
  if (sectionSlug === "jobs") return "KOREA";
  return "KOREA";
}

export async function publishCuratedTradePost(
  input: PublishCuratedTradeInput
): Promise<{ id: string; href: string }> {
  const categorySlug = resolveCurateCategorySlug(
    input.contentType,
    input.categorySlug
  );
  if (!categorySlug) {
    throw new Error("게시판 카테고리를 결정할 수 없습니다.");
  }

  const category = await prisma.category.findFirst({
    where: { slug: categorySlug, isActive: true },
  });
  if (!category?.parentId) {
    throw new Error(
      `카테고리 ${categorySlug}가 DB에 없습니다. npm run db:upsert-promo 실행 후 다시 시도하세요.`
    );
  }

  const sectionSlug = await getRootSectionSlug(category.id);

  const title = input.rawItem
    ? enrichCurateTitle(input.rawItem)
    : input.title.trim();
  const content = input.rawItem
    ? enrichCurateBody(input.rawItem)
    : input.body.trim();
  const summary =
    content.replace(/\s+/g, " ").trim().slice(0, 160) || title;

  const post = await prisma.post.create({
    data: {
      title,
      summary,
      content,
      sourceUrl: buildAiCurateSourceUrl(),
      sourceName: input.sourceLabel?.trim() || "카톡 단톡방",
      topic: topicForSection(sectionSlug),
      categoryId: category.id,
      publishedAt: new Date(),
      isAutomated: false,
      isCrawl: input.isCrawl ?? true,
      storeName: input.storeName?.trim() || null,
      kakaoLink: input.kakaoLink?.trim() || null,
      region: input.region?.trim() || null,
      thumbnail: input.imageUrl?.trim() || null,
      status: "PUBLISHED",
      authorId: input.authorId,
      attachments: input.imageUrl
        ? {
            create: [
              {
                url: input.imageUrl,
                fileName: "curate-image",
                mimeType: "image/jpeg",
                size: 0,
                kind: "IMAGE",
                sortOrder: 0,
              },
            ],
          }
        : undefined,
    },
  });

  await indexPostInSearch({
    id: post.id,
    title: post.title,
    summary: post.summary,
    content: post.content,
    status: post.status,
  });

  revalidatePostCaches(post.id, {
    sectionSlug,
    categoryHref: category.href,
  });

  if (sectionSlug === "promo") {
    revalidatePath("/promo");
    if (post.storeName) {
      revalidatePath(promoStoreTimelineHref(slugifyStoreName(post.storeName)));
    }
  }

  const href =
    sectionSlug === "promo" && post.storeName
      ? promoStoreTimelineHref(slugifyStoreName(post.storeName))
      : `/posts/${post.id}`;

  return { id: post.id, href };
}

export type UpdateCuratedTradeInput = {
  title?: string;
  body: string;
  kakaoLink?: string | null;
  region?: string | null;
  imageUrl?: string | null;
};

/** 동일 주제 글에 추가 내용 반영 — 타임라인 상단으로 올림 */
export async function updateCuratedTradePost(
  postId: string,
  input: UpdateCuratedTradeInput
): Promise<{ id: string; href: string }> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      category: { include: { parent: { select: { slug: true, href: true } } } },
    },
  });

  if (!post?.category?.parentId) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  const sectionSlug = await getRootSectionSlug(post.categoryId);

  const content = input.body.trim();
  const title = (input.title ?? post.title).trim();
  const summary =
    content.replace(/\s+/g, " ").trim().slice(0, 160) || title;

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      summary,
      content,
      publishedAt: new Date(),
      kakaoLink: input.kakaoLink?.trim() || post.kakaoLink,
      region: input.region?.trim() || post.region,
      thumbnail: input.imageUrl?.trim() || post.thumbnail,
    },
  });

  await indexPostInSearch({
    id: updated.id,
    title: updated.title,
    summary: updated.summary,
    content: updated.content,
    status: updated.status,
  });

  revalidatePostCaches(updated.id, {
    sectionSlug,
    categoryHref: post.category.href,
  });

  if (sectionSlug === "promo") {
    revalidatePath("/promo");
    if (updated.storeName) {
      revalidatePath(promoStoreTimelineHref(slugifyStoreName(updated.storeName)));
    }
  }

  const href =
    sectionSlug === "promo" && updated.storeName
      ? promoStoreTimelineHref(slugifyStoreName(updated.storeName))
      : `/posts/${updated.id}`;

  return { id: updated.id, href };
}

export function slugifyStoreName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 48);
  return base || "store";
}
