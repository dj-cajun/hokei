import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { LifeDomain, PrismaClient } from "../src/generated/prisma/client";

export type KakaoSeedPostRowV4 = {
  categoryId: string;
  title: string;
  summary: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  topic?: string;
  region?: string | null;
  storeName?: string | null;
  kakaoLink?: string | null;
  isCrawl?: boolean;
  publishedAt: string;
};

const V4_SEED_FILE = "data/kakao-curate-seed-posts-v4.json";

const LIFE_CATEGORY_DOMAIN: Record<string, LifeDomain> = {
  "life-study": "STUDY",
  "life-health": "CLOTHES",
  "life-transport": "TRANSPORT",
  "life-realestate": "HOUSING",
  "life-flower": "FOOD",
};

export function slugFromKakaoV4SourceUrl(sourceUrl: string): string {
  const tail = sourceUrl.replace(/^hokei:ad:[^:]+:/, "");
  return tail.replace(/:/g, "-").slice(0, 80) || `study-${Date.now()}`;
}

export function loadKakaoV4SeedRows(): KakaoSeedPostRowV4[] {
  const filePath = join(process.cwd(), V4_SEED_FILE);
  if (!existsSync(filePath)) {
    throw new Error(`[seed-kakao-v4] ${V4_SEED_FILE} 없음`);
  }
  return JSON.parse(readFileSync(filePath, "utf-8")) as KakaoSeedPostRowV4[];
}

export async function seedKakaoV4LifeGuides(
  prisma: PrismaClient
): Promise<number> {
  const rows = loadKakaoV4SeedRows().filter((row) =>
    row.categoryId.startsWith("life-")
  );

  if (rows.length === 0) {
    throw new Error("[seed-kakao-v4] life-* 항목이 없습니다.");
  }

  let upserted = 0;
  for (const row of rows) {
    const domain = LIFE_CATEGORY_DOMAIN[row.categoryId];
    if (!domain) {
      throw new Error(
        `[seed-kakao-v4] 알 수 없는 life 카테고리: ${row.categoryId}`
      );
    }

    const slug = slugFromKakaoV4SourceUrl(row.sourceUrl);
    await prisma.lifeGuide.upsert({
      where: { slug },
      create: {
        slug,
        kind: "PHRASE",
        domain,
        title: row.title.trim(),
        vnText: row.summary.trim() || null,
        body: row.content.trim(),
        sourceLabel: row.sourceName.trim(),
        isCrawl: row.isCrawl ?? true,
        publishedAt: new Date(row.publishedAt),
      },
      update: {
        kind: "PHRASE",
        domain,
        title: row.title.trim(),
        vnText: row.summary.trim() || null,
        body: row.content.trim(),
        sourceLabel: row.sourceName.trim(),
        isCrawl: row.isCrawl ?? true,
        publishedAt: new Date(row.publishedAt),
      },
    });
    upserted += 1;
  }

  return upserted;
}
