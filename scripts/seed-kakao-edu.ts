/**
 * kakao-edu1.json → LifeGuide (베트남어 공부) upsert
 * npm run db:seed:kakao-edu
 */
import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { seedKakaoEduLifeGuides } from "../prisma/seed-kakao-edu";

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgres")) {
    throw new Error("DATABASE_URL=postgresql://… 필요");
  }

  const prisma = createPostgresPrisma(url);
  console.log("🔄 kakao-edu1 → LifeGuide Upsert…");
  const count = await seedKakaoEduLifeGuides(prisma);
  console.log(`✅ LifeGuide ${count}건 동기화 (slug 기준 create/update)`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
