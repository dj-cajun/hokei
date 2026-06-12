import type { PostTopic } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveAutomatedNewsThumbnail } from "@/lib/news/resolve-post-thumbnail";
import { resolveNewsCategorySlug } from "@/lib/news/resolve-news-category";
import { sanitizeStoredSourceName } from "@/lib/news/source-display";
import { indexPostInSearch } from "@/lib/search/index-post";

export type PublishCuratedNewsInput = {
  title: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  categoryId: string;
  topic?: PostTopic;
  thumbnail?: string | null;
  originalTitle?: string;
  authorId: string;
};

export async function publishCuratedNews(
  input: PublishCuratedNewsInput
): Promise<{ id: string }> {
  const sourceUrl = input.sourceUrl.trim();
  const title = input.title.trim();
  const content = input.content.trim();

  const existing = await prisma.post.findUnique({
    where: { sourceUrl },
    select: { id: true },
  });
  if (existing) {
    throw new Error("이미 등록된 출처 URL입니다. 다른 URL이거나 기존 글을 수정하세요.");
  }

  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    include: { parent: { select: { slug: true } } },
  });
  if (!category?.parent || category.parent.slug !== "news") {
    throw new Error("뉴스 하위 카테고리를 선택하세요.");
  }

  const summary = content.replace(/\s+/g, " ").trim().slice(0, 160) || title;
  const topic =
    input.topic ??
    (() => {
      const slug = resolveNewsCategorySlug({
        topic: "KOREA",
        title,
        summary,
        sourceName: input.sourceName,
      });
      if (slug.includes("visa")) return "VIETNAM_POLICY" as const;
      if (slug.includes("school")) return "TOURIST" as const;
      return "KOREA" as const;
    })();

  let thumbnail = input.thumbnail?.trim() || null;
  if (!thumbnail) {
    thumbnail = await resolveAutomatedNewsThumbnail({
      topic,
      link: sourceUrl,
      rssDescription: summary,
    });
  }

  const now = new Date();
  const post = await prisma.post.create({
    data: {
      title,
      summary,
      content,
      sourceUrl,
      sourceName: sanitizeStoredSourceName(input.sourceName),
      topic,
      categoryId: category.id,
      originalTitle: input.originalTitle?.trim() || title,
      thumbnail,
      publishedAt: now,
      ingestedAt: now,
      isAutomated: false,
      status: "PUBLISHED",
      authorId: input.authorId,
    },
  });

  await indexPostInSearch({
    id: post.id,
    title: post.title,
    summary: post.summary,
    content: post.content,
    status: post.status,
  });

  return { id: post.id };
}
