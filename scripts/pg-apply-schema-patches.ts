/**
 * Postgres 프로덕션 — migrate deploy 실패·누락 시 idempotent 스키마 보완
 * Vercel 빌드에서 prisma-generate-for-deploy 이후 호출
 */
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.log("[pg-patch] Postgres가 아니어서 건너뜀");
  process.exit(0);
}

const prisma = createPostgresPrisma(url);

async function exec(sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (err) {
    console.warn("[pg-patch] skip:", sql.slice(0, 72).replace(/\s+/g, " "), err);
  }
}

async function main() {
  console.log("[pg-patch] Postgres 스키마 보완 …");

  await exec(`
    DO $$ BEGIN
      CREATE TYPE "ModerationStatus" AS ENUM ('VISIBLE', 'HIDDEN', 'REMOVED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

  await exec(
    `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3)`
  );
  await exec(
    `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderatedById" TEXT`
  );
  await exec(
    `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT`
  );

  await exec(`
    DO $$ BEGIN
      ALTER TABLE "Post" ADD COLUMN "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'VISIBLE';
    EXCEPTION WHEN duplicate_column THEN NULL; END $$`);

  await exec(`ALTER TABLE "Post" ALTER COLUMN "moderationStatus" DROP DEFAULT`);
  await exec(`
    ALTER TABLE "Post"
      ALTER COLUMN "moderationStatus" TYPE "ModerationStatus"
      USING (
        CASE
          WHEN "moderationStatus"::text IN ('VISIBLE', 'HIDDEN', 'REMOVED')
          THEN ("moderationStatus"::text)::"ModerationStatus"
          ELSE 'VISIBLE'::"ModerationStatus"
        END
      )`);
  await exec(`
    ALTER TABLE "Post"
      ALTER COLUMN "moderationStatus" SET DEFAULT 'VISIBLE'::"ModerationStatus",
      ALTER COLUMN "moderationStatus" SET NOT NULL`);

  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false`
  );
  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3)`
  );
  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenById" TEXT`
  );

  await exec(
    `ALTER TABLE "NewsIngestRun" ADD COLUMN IF NOT EXISTS "errorDetails" TEXT`
  );
  await exec(
    `ALTER TABLE "NewsIngestRun" ADD COLUMN IF NOT EXISTS "durationMs" INTEGER`
  );
  await exec(
    `ALTER TABLE "NewsIngestRun" ADD COLUMN IF NOT EXISTS "triggeredBy" TEXT`
  );

  await exec(
    `CREATE INDEX IF NOT EXISTS "Post_moderationStatus_idx" ON "Post"("moderationStatus")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Comment_isHidden_idx" ON "Comment"("isHidden")`
  );

  await prisma.$disconnect();
  console.log("[pg-patch] 완료");
}

main().catch((err) => {
  console.error("[pg-patch] 실패", err);
  process.exit(1);
});
