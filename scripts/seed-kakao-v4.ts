/**
 * 카톡 v4 export → LifeGuide upsert (life-study 등)
 * npm run db:seed:kakao-v4
 */
import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { seedKakaoV4LifeGuides } from "../prisma/seed-kakao-v4";

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL=postgresql://… 필요");
  }

  const prisma = createPostgresPrisma(url);
  console.log("🔄 카톡 v4 → LifeGuide Upsert…");
  const count = await seedKakaoV4LifeGuides(prisma);
  console.log(`✅ LifeGuide ${count}건 동기화 (slug 기준 create/update)`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
