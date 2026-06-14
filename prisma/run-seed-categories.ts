import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { seedCategories } from "./seed-categories";

const connectionString = process.env.DATABASE_URL?.trim() ?? "";
if (!connectionString.startsWith("postgres")) {
  console.error("[seed:categories] DATABASE_URL=postgresql://… 필요 (단일 Postgres)");
  process.exit(1);
}
const prisma = createPostgresPrisma(connectionString);

if (!process.argv.includes("--force-reset")) {
  console.error(
    "⚠️  전체 카테고리 삭제 후 재생성입니다. 실행: npm run db:seed:categories -- --force-reset"
  );
  process.exit(1);
}

seedCategories(prisma)
  .then(() => console.log("✅ 카테고리만 재시드 완료 (--force-reset)"))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
