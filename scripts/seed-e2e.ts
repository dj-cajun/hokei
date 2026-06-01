/**
 * CI·E2E용 최소 데이터 (카테고리 + 샘플 글 1건)
 */
import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCategories } from "../prisma/seed-categories";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await seedCategories(prisma);
    console.log("[seed-e2e] categories seeded");
  }

  const postCount = await prisma.post.count();
  if (postCount > 0) {
    console.log(`[seed-e2e] posts already exist (${postCount}) — skip`);
    return;
  }

  const category = await prisma.category.findFirst({
    where: { slug: "news-visa-residency" },
  });
  if (!category) {
    throw new Error("[seed-e2e] news-visa-residency category missing");
  }

  await prisma.post.create({
    data: {
      title: "E2E 테스트 — 호치민 교민 뉴스",
      summary: "Playwright smoke test sample post.",
      content: "자동화 테스트용 본문입니다.",
      sourceUrl: "https://e2e.hokei.local/sample-post",
      sourceName: "Hokei E2E",
      topic: "KOREA",
      categoryId: category.id,
      publishedAt: new Date(),
      isAutomated: false,
      status: "PUBLISHED",
    },
  });

  console.log("[seed-e2e] sample post created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
