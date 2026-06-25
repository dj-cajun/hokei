import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PostTopic, PrismaClient } from "../src/generated/prisma/client";
import { AI_CURATE_SOURCE_PREFIX } from "../src/lib/ai-curate-source";
import { COMMUNITY_SOURCE_PREFIX } from "../src/lib/community";
import { inferContactLine } from "../src/lib/crawl-contact";
import type { RegionSlug } from "../src/lib/regions";

export type KakaoSeedPostRow = {
  categorySlug: string;
  title: string;
  summary: string;
  content: string;
  sourceKey: string;
  sourceName: string;
  topic: PostTopic;
  region?: string | null;
  storeName?: string | null;
  kakaoLink?: string | null;
  /** 타임라인 시드 — YYYY-MM-DD */
  publishedAtDate?: string;
};

export type KakaoSeedTimelineUpdate = {
  date: string;
  title: string;
  body: string;
};

export type KakaoSeedTimelineStore = {
  storeName: string;
  categorySlug: string;
  region?: string | null;
  kakaoLink?: string | null;
  sourceName?: string | null;
  timelineUpdates: KakaoSeedTimelineUpdate[];
};

const POST_SEED_FILES = [
  "data/kakao-curate-seed-posts.json",
  "data/kakao-curate-seed-posts-v2.json",
  "data/kakao-curate-seed-posts-v3.json",
] as const;

const TIMELINE_SEED_FILES = ["data/kakao-curate-seed-timelines-v2.json"] as const;

const REGION_ALIAS: Record<string, RegionSlug> = {
  D1: "district-1",
  D2: "district-2",
  D7: "district-7",
  D9: "district-9",
  BHTAN: "binh-thanh",
  BINHTHAN: "binh-thanh",
  HCMC: "other",
  HANOI: "hanoi",
};

export function mapSeedRegion(raw: string | null | undefined): RegionSlug | null {
  if (!raw) return null;
  return REGION_ALIAS[raw] ?? null;
}

export function parsePublishedAtFromSourceKey(sourceKey: string): Date {
  const match = sourceKey.match(/(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/);
  if (!match) return new Date();
  const [, year, month, day, hour, minute] = match;
  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:00+07:00`
  );
}

export function parsePublishedAtFromDate(date: string): Date {
  return new Date(`${date}T12:00:00+07:00`);
}

export function buildSeedSourceUrl(categorySlug: string, sourceKey: string): string {
  if (categorySlug.startsWith("community-")) {
    return `${COMMUNITY_SOURCE_PREFIX}${sourceKey}`;
  }
  return `${AI_CURATE_SOURCE_PREFIX}${sourceKey}`;
}

function slugifyStoreKey(storeName: string): string {
  return storeName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u3131-\uD79D-]/g, "")
    .slice(0, 48);
}

export function expandTimelineStores(
  stores: KakaoSeedTimelineStore[]
): KakaoSeedPostRow[] {
  const rows: KakaoSeedPostRow[] = [];

  for (const store of stores) {
    const storeKey = slugifyStoreKey(store.storeName);
    const sourceName = store.sourceName?.trim() || store.storeName.trim();

    for (const update of store.timelineUpdates) {
      const dateKey = update.date.replace(/-/g, "");
      const sourceKey = `kakaotalk:hoc-room-2:timeline:${storeKey}:${dateKey}`;
      const summary =
        update.body.replace(/\s+/g, " ").trim().slice(0, 160) ||
        update.title.trim();

      rows.push({
        categorySlug: store.categorySlug,
        title: update.title.trim(),
        summary,
        content: update.body.trim(),
        sourceKey,
        sourceName,
        topic: store.categorySlug.includes("inconvenient")
          ? "VIETNAM_POLICY"
          : "KOREA",
        region: store.region ?? null,
        storeName: store.storeName.trim(),
        kakaoLink: store.kakaoLink?.trim() || null,
        publishedAtDate: update.date,
      });
    }
  }

  return rows;
}

function readJsonFile<T>(relativePath: string): T | null {
  const filePath = join(process.cwd(), relativePath);
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

export function loadKakaoSeedPosts(): KakaoSeedPostRow[] {
  const posts: KakaoSeedPostRow[] = [];

  for (const file of POST_SEED_FILES) {
    const chunk = readJsonFile<KakaoSeedPostRow[]>(file);
    if (chunk?.length) posts.push(...chunk);
  }

  for (const file of TIMELINE_SEED_FILES) {
    const stores = readJsonFile<KakaoSeedTimelineStore[]>(file);
    if (stores?.length) posts.push(...expandTimelineStores(stores));
  }

  if (posts.length === 0) {
    throw new Error(
      "[seed-kakao] data/kakao-curate-seed-posts*.json 이 비어 있습니다."
    );
  }

  return posts;
}

function resolveSeedKakaoLink(row: KakaoSeedPostRow): string | null {
  if (row.kakaoLink === null) return null;
  if (row.kakaoLink?.trim()) return row.kakaoLink.trim();
  return inferContactLine({
    content: row.content,
    sourceName: row.sourceName,
  });
}

function rowToPostData(
  row: KakaoSeedPostRow,
  categoryId: string
): {
  title: string;
  summary: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  topic: PostTopic;
  region: RegionSlug | null;
  categoryId: string;
  publishedAt: Date;
  isNotice: boolean;
  status: "PUBLISHED";
  moderationStatus: "VISIBLE";
  isAutomated: boolean;
  isCrawl: boolean;
  storeName: string | null;
  kakaoLink: string | null;
  guestName: string | null;
} {
  const sourceUrl = buildSeedSourceUrl(row.categorySlug, row.sourceKey);
  const isCommunity = row.categorySlug.startsWith("community-");
  const publishedAt = row.publishedAtDate
    ? parsePublishedAtFromDate(row.publishedAtDate)
    : parsePublishedAtFromSourceKey(row.sourceKey);

  return {
    title: row.title.trim(),
    summary: row.summary.trim(),
    content: row.content.trim(),
    sourceUrl,
    sourceName: row.sourceName.trim(),
    topic: row.topic,
    region: mapSeedRegion(row.region),
    categoryId,
    publishedAt,
    isNotice: false,
    status: "PUBLISHED",
    moderationStatus: "VISIBLE",
    isAutomated: false,
    isCrawl: true,
    storeName: row.storeName?.trim() || null,
    kakaoLink: resolveSeedKakaoLink(row),
    guestName: isCommunity ? row.sourceName.trim() : null,
  };
}

export async function syncKakaoPostContacts(prisma: PrismaClient): Promise<number> {
  return seedKakaoPosts(prisma);
}

export async function seedKakaoPosts(prisma: PrismaClient): Promise<number> {
  const rows = loadKakaoSeedPosts();
  const slugs = [...new Set(rows.map((row) => row.categorySlug))];
  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const missing = slugs.filter((slug) => !categoryBySlug.has(slug));
  if (missing.length > 0) {
    throw new Error(
      `[seed-kakao] 카테고리 없음: ${missing.join(", ")} — npm run db:seed:categories && npm run db:upsert-promo && npm run db:upsert-trade 실행 후 재시도`
    );
  }

  let upserted = 0;
  for (const row of rows) {
    const categoryId = categoryBySlug.get(row.categorySlug)!;
    const data = rowToPostData(row, categoryId);
    await prisma.post.upsert({
      where: { sourceUrl: data.sourceUrl },
      create: data,
      update: {
        title: data.title,
        summary: data.summary,
        content: data.content,
        sourceName: data.sourceName,
        topic: data.topic,
        region: data.region,
        categoryId: data.categoryId,
        publishedAt: data.publishedAt,
        storeName: data.storeName,
        kakaoLink: data.kakaoLink,
        guestName: data.guestName,
        isCrawl: true,
        status: "PUBLISHED",
        moderationStatus: "VISIBLE",
      },
    });
    upserted += 1;
  }

  return upserted;
}
