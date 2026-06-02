import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCategories } from "./seed-categories";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

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
