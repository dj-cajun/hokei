/**
 * 카톡 단톡방 정제 데이터 → Post upsert (sourceUrl 기준 덮어쓰기)
 * npm run db:seed:kakao
 */
import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { seedKakaoPosts } from "../prisma/seed-kakao-posts";
import { isPgFtsReady, reindexAllPostsPgFts } from "../src/lib/search/post-pg-fts";

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL=postgresql://… 필요");
  }

  const prisma = createPostgresPrisma(url);
  console.log("🔄 카톡 수집 데이터 Upsert 동기화 시작…");
  const count = await seedKakaoPosts(prisma);
  console.log(`✅ ${count}건 동기화 완료 (sourceUrl 기준 create/update)`);

  if (await isPgFtsReady()) {
    const indexed = await reindexAllPostsPgFts();
    console.log(`🔍 검색 인덱스 ${indexed}건 갱신`);
  } else {
    console.log("ℹ️  PG FTS 미설정 — npm run search:pg:setup 후 재시드하면 검색 반영됩니다.");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
