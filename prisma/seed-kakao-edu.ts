import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PrismaClient } from "../src/generated/prisma/client";
import {
  normalizeKakaoEduRow,
  type KakaoEduImportRow,
} from "../src/lib/life/normalize-study-import";

const EDU_SEED_FILE = "data/kakao-edu1.json";

export function loadKakaoEduSeedRows(): KakaoEduImportRow[] {
  const filePath = join(process.cwd(), EDU_SEED_FILE);
  if (!existsSync(filePath)) {
    throw new Error(`[seed-kakao-edu] ${EDU_SEED_FILE} 없음`);
  }
  const rows = JSON.parse(readFileSync(filePath, "utf-8")) as KakaoEduImportRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("[seed-kakao-edu] 항목이 없습니다.");
  }
  return rows;
}

export async function seedKakaoEduLifeGuides(
  prisma: PrismaClient
): Promise<number> {
  const rows = loadKakaoEduSeedRows();

  for (let i = 0; i < rows.length; i++) {
    const data = normalizeKakaoEduRow(rows[i]!);
    await prisma.lifeGuide.upsert({
      where: { slug: data.slug },
      create: data,
      update: {
        kind: data.kind,
        domain: data.domain,
        title: data.title,
        vnText: data.vnText,
        body: data.body,
        externalUrl: data.externalUrl,
        sourceLabel: data.sourceLabel,
        isCrawl: data.isCrawl,
        publishedAt: data.publishedAt,
      },
    });
    if ((i + 1) % 50 === 0 || i + 1 === rows.length) {
      console.log(`  … ${i + 1}/${rows.length}`);
    }
  }

  return rows.length;
}
