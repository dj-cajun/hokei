import { mergeCurateBodies } from "@/lib/ai/curate-content-merge";
import type { CurateKakaoItem } from "@/lib/ai/curate-kakao-schemas";
import {
  areDuplicateNews,
  jaccardSimilarity,
  titlesAreSimilar,
} from "@/lib/news/dedupe";
import { prisma } from "@/lib/prisma";

export type CurateSkippedDuplicate = {
  title: string;
  contentType: string;
  reason: string;
};

export type CurateUpdateItem = {
  item: CurateKakaoItem;
  postId: string;
  existingTitle: string;
  mergedBody: string;
  mergedTitle: string;
};

export type CurateLifeUpdateItem = {
  item: CurateKakaoItem;
  guideId: string;
  existingTitle: string;
  mergedBody: string;
};

export type ClassifyCurateResult = {
  newItems: CurateKakaoItem[];
  updateItems: CurateUpdateItem[];
  lifeUpdateItems: CurateLifeUpdateItem[];
  skippedDuplicates: CurateSkippedDuplicate[];
  stats: {
    extracted: number;
    new: number;
    update: number;
    duplicate: number;
  };
};

function normalizeStore(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "");
}

export function areDuplicateCurateItems(
  a: CurateKakaoItem,
  b: CurateKakaoItem
): boolean {
  if (a.contentType !== b.contentType) return false;

  if (a.contentType === "PROMO" && a.storeName?.trim() && b.storeName?.trim()) {
    if (normalizeStore(a.storeName) !== normalizeStore(b.storeName)) {
      return false;
    }
  }

  return areDuplicateNews(
    { title: a.title, content: a.body, description: a.summary },
    { title: b.title, content: b.body, description: b.summary }
  );
}

type ExistingPost = {
  id: string;
  title: string;
  content: string | null;
  summary: string;
  storeName: string | null;
};

type ExistingLife = {
  id: string;
  title: string;
  body: string;
};

function isSameCurateTopic(
  item: CurateKakaoItem,
  post: ExistingPost
): boolean {
  if (item.contentType === "PROMO") {
    if (!item.storeName?.trim() || !post.storeName) return false;
    if (normalizeStore(item.storeName) !== normalizeStore(post.storeName)) {
      return false;
    }
    if (titlesAreSimilar(item.title, post.title)) return true;
    const sim = jaccardSimilarity(
      item.body,
      post.content ?? "",
      2
    );
    return sim >= 0.42;
  }

  if (titlesAreSimilar(item.title, post.title)) return true;
  return jaccardSimilarity(item.body, post.content ?? "", 2) >= 0.55;
}

function isExactDuplicatePost(
  item: CurateKakaoItem,
  post: ExistingPost
): boolean {
  if (item.contentType === "PROMO" && item.storeName?.trim() && post.storeName) {
    if (normalizeStore(item.storeName) !== normalizeStore(post.storeName)) {
      return false;
    }
  }

  return areDuplicateNews(
    { title: item.title, content: item.body, description: item.summary },
    { title: post.title, content: post.content, description: post.summary }
  );
}

function dedupeWithinBatch(items: CurateKakaoItem[]): {
  unique: CurateKakaoItem[];
  skipped: CurateSkippedDuplicate[];
} {
  const unique: CurateKakaoItem[] = [];
  const skipped: CurateSkippedDuplicate[] = [];

  for (const item of items) {
    if (unique.some((u) => areDuplicateCurateItems(u, item))) {
      skipped.push({
        title: item.title,
        contentType: item.contentType,
        reason: "이번 분석에서 동일 시간·내용 중복",
      });
      continue;
    }
    unique.push(item);
  }

  return { unique, skipped };
}

async function loadExistingContent(): Promise<{
  posts: ExistingPost[];
  lifeGuides: ExistingLife[];
}> {
  const [posts, lifeGuides] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED", isCrawl: true },
      orderBy: { publishedAt: "desc" },
      take: 1000,
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        storeName: true,
      },
    }),
    prisma.lifeGuide.findMany({
      where: { isCrawl: true },
      orderBy: { publishedAt: "desc" },
      take: 300,
      select: { id: true, title: true, body: true },
    }),
  ]);

  return { posts, lifeGuides };
}

function classifyAgainstPost(
  item: CurateKakaoItem,
  post: ExistingPost
): "skip" | "update" | "none" {
  if (!POST_CURATE_TYPES.has(item.contentType)) return "none";

  if (isExactDuplicatePost(item, post)) return "skip";

  // 홍보: 같은 가게라도 다른 날·다른 메뉴 홍보는 신규 Post로 타임라인 누적
  if (item.contentType === "PROMO") {
    if (
      item.storeName?.trim() &&
      post.storeName &&
      normalizeStore(item.storeName) === normalizeStore(post.storeName)
    ) {
      const sim = jaccardSimilarity(item.body, post.content ?? "", 2);
      if (sim >= 0.72) {
        const merged = mergeCurateBodies(post.content ?? "", item.body);
        if (merged) return "update";
      }
    }
    return "none";
  }

  if (!isSameCurateTopic(item, post)) return "none";

  const merged = mergeCurateBodies(post.content ?? "", item.body);
  if (!merged) return "skip";

  if (
    areDuplicateNews(
      { title: item.title, content: merged },
      { title: post.title, content: post.content }
    )
  ) {
    return "skip";
  }

  return "update";
}

const POST_CURATE_TYPES = new Set([
  "REAL_ESTATE",
  "CLASSIFIED",
  "JOBS",
  "PROMO",
]);

/** 배치 내 중복 제거 + DB 비교 → 신규 / 업데이트 / 스킵 분류 */
export async function classifyCurateItems(
  items: CurateKakaoItem[]
): Promise<ClassifyCurateResult> {
  const { unique, skipped: batchSkipped } = dedupeWithinBatch(items);
  const { posts, lifeGuides } = await loadExistingContent();

  const newItems: CurateKakaoItem[] = [];
  const updateItems: CurateUpdateItem[] = [];
  const lifeUpdateItems: CurateLifeUpdateItem[] = [];
  const skippedDuplicates = [...batchSkipped];

  for (const item of unique) {
    if (item.contentType === "VIETNAMESE_STUDY") {
      const lifeHit = lifeGuides.find((g) =>
        areDuplicateNews(
          { title: item.title, content: item.body },
          { title: g.title, content: g.body }
        )
      );
      if (lifeHit) {
        skippedDuplicates.push({
          title: item.title,
          contentType: item.contentType,
          reason: `동일 공부 글: ${lifeHit.title.slice(0, 40)}`,
        });
        continue;
      }

      const lifeUpdate = lifeGuides.find((g) => {
        if (!titlesAreSimilar(item.title, g.title)) return false;
        const merged = mergeCurateBodies(g.body, item.body);
        return merged !== null;
      });

      if (lifeUpdate) {
        const merged = mergeCurateBodies(lifeUpdate.body, item.body)!;
        lifeUpdateItems.push({
          item,
          guideId: lifeUpdate.id,
          existingTitle: lifeUpdate.title,
          mergedBody: merged,
        });
        continue;
      }

      newItems.push(item);
      continue;
    }

    if (!POST_CURATE_TYPES.has(item.contentType)) {
      if (item.contentType === "UNKNOWN") {
        skippedDuplicates.push({
          title: item.title,
          contentType: item.contentType,
          reason: "분류 불가",
        });
      } else {
        newItems.push(item);
      }
      continue;
    }

    let action: "skip" | "update" | "create" = "create";
    let matchedPost: ExistingPost | null = null;
    let mergedBody = "";

    for (const post of posts) {
      const verdict = classifyAgainstPost(item, post);
      if (verdict === "skip") {
        action = "skip";
        matchedPost = post;
        break;
      }
      if (verdict === "update") {
        action = "update";
        matchedPost = post;
        mergedBody = mergeCurateBodies(post.content ?? "", item.body)!;
        break;
      }
    }

    if (action === "skip" && matchedPost) {
      skippedDuplicates.push({
        title: item.title,
        contentType: item.contentType,
        reason: `동일 내용 (기존: ${matchedPost.title.slice(0, 36)})`,
      });
      continue;
    }

    if (action === "update" && matchedPost) {
      updateItems.push({
        item,
        postId: matchedPost.id,
        existingTitle: matchedPost.title,
        mergedBody,
        mergedTitle: item.title.length > matchedPost.title.length ? item.title : matchedPost.title,
      });
      continue;
    }

    newItems.push(item);
  }

  return {
    newItems,
    updateItems,
    lifeUpdateItems,
    skippedDuplicates,
    stats: {
      extracted: items.length,
      new: newItems.length,
      update: updateItems.length + lifeUpdateItems.length,
      duplicate: skippedDuplicates.length,
    },
  };
}

/** @deprecated classifyCurateItems 사용 */
export async function filterNewCurateItems(items: CurateKakaoItem[]) {
  const result = await classifyCurateItems(items);
  return {
    newItems: result.newItems,
    skippedDuplicates: result.skippedDuplicates,
    stats: {
      extracted: result.stats.extracted,
      new: result.stats.new,
      duplicate: result.stats.duplicate,
    },
  };
}
