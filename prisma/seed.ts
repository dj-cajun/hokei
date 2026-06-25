import "dotenv/config";
import { hash } from "bcryptjs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { createPostgresPrisma } from "../src/lib/prisma-pg";
import { seedCategories } from "./seed-categories";
import { seedKakaoPosts } from "./seed-kakao-posts";

function createSeedPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim() ?? "";
  if (!connectionString.startsWith("postgres")) {
    throw new Error(
      "[seed] DATABASE_URL=postgresql://… 필요 (단일 Postgres — 로컬은 Neon dev 브랜치)"
    );
  }
  return createPostgresPrisma(connectionString);
}

const prisma = createSeedPrisma();

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
      emailVerified: new Date(),
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
      emailVerified: new Date(),
    },
  });

  await seedCategories(prisma);

  if (process.env.SEED_KAKAO_POSTS === "1") {
    const count = await seedKakaoPosts(prisma);
    console.log(`   카톡 시드: ${count}건 적재`);
  }

  console.log("✅ 시드 완료");
  console.log("   관리자: admin@hokei.vn / admin1234");
  console.log("   일반:   demo@hokei.vn / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
