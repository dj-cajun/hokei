import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedCategories } from "./seed-categories";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await hash("admin1234", 12);

  await prisma.user.upsert({
    where: { email: "admin@hokei.vn" },
    update: {},
    create: {
      email: "admin@hokei.vn",
      name: "호케이 관리자",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const demoPassword = await hash("demo1234", 12);

  await prisma.user.upsert({
    where: { email: "demo@hokei.vn" },
    update: {},
    create: {
      email: "demo@hokei.vn",
      name: "데모 사용자",
      password: demoPassword,
      role: "USER",
    },
  });

  await seedCategories(prisma);

  console.log("✅ 시드 완료");
  console.log("   관리자: admin@hokei.vn / admin1234");
  console.log("   일반:   demo@hokei.vn / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
