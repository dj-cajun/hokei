import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCategories } from "./seed-categories";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

seedCategories(prisma)
  .then(() => console.log("✅ 카테고리만 재시드 완료"))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
