/**
 * Postgres 프로덕션 — migrate deploy 실패·누락 시 idempotent 컬럼/테이블 보완
 * Vercel 빌드에서 prisma-generate-for-deploy 이후 호출
 */
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.log("[pg-patch] Postgres가 아니어서 건너뜀");
  process.exit(0);
}

const prisma = createPostgresPrisma(url);

const statements = [
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT NOT NULL DEFAULT 'VISIBLE'`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderatedById" TEXT`,
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT`,
  `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3)`,
  `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenById" TEXT`,
  `ALTER TABLE "NewsIngestRun" ADD COLUMN IF NOT EXISTS "errorDetails" TEXT`,
  `ALTER TABLE "NewsIngestRun" ADD COLUMN IF NOT EXISTS "durationMs" INTEGER`,
  `ALTER TABLE "NewsIngestRun" ADD COLUMN IF NOT EXISTS "triggeredBy" TEXT`,
  `CREATE INDEX IF NOT EXISTS "Post_moderationStatus_idx" ON "Post"("moderationStatus")`,
  `CREATE INDEX IF NOT EXISTS "Comment_isHidden_idx" ON "Comment"("isHidden")`,
];

async function main() {
  console.log("[pg-patch] Postgres 스키마 보완 …");
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn("[pg-patch] skip:", sql.slice(0, 60), err);
    }
  }
  await prisma.$disconnect();
  console.log("[pg-patch] 완료");
}

main().catch((err) => {
  console.error("[pg-patch] 실패", err);
  process.exit(1);
});
