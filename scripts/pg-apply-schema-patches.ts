/**
 * Postgres 프로덕션 — migrate deploy 실패·누락 시 idempotent 스키마 보완
 * Vercel 빌드에서 prisma-generate-for-deploy 이후 호출
 */
import { spawnSync } from "child_process";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.log("[pg-patch] Postgres가 아니어서 건너뜀");
  process.exit(0);
}

// 로컬에서 sqlite client가 남아 있으면 adapter 불일치 — PG client 재생성
const gen = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: url,
    PRISMA_SCHEMA: "prisma/schema.postgresql.prisma",
  },
});
if (gen.status !== 0) {
  process.exit(gen.status ?? 1);
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

  await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kakaoId" TEXT`);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_kakaoId_key" ON "User"("kakaoId")`
  );

  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false`
  );
  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenAt" TIMESTAMP(3)`
  );
  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "hiddenById" TEXT`
  );

  await exec(`
    CREATE TABLE IF NOT EXISTS "NewsIngestRun" (
      "id" TEXT NOT NULL,
      "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "inserted" INTEGER NOT NULL DEFAULT 0,
      "skipped" INTEGER NOT NULL DEFAULT 0,
      "errors" TEXT,
      "errorDetails" TEXT,
      "durationMs" INTEGER,
      "triggeredBy" TEXT,
      "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
      CONSTRAINT "NewsIngestRun_pkey" PRIMARY KEY ("id")
    )`);
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

  await exec(`
    DO $$ BEGIN
      CREATE TYPE "PostTopic" AS ENUM ('KOREA', 'TRAVEL', 'VIETNAM_POLICY', 'TOURIST');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`);

  await exec(`
    CREATE TABLE IF NOT EXISTS "NewsSourceConfig" (
      "id" TEXT NOT NULL,
      "topic" "PostTopic" NOT NULL,
      "type" TEXT NOT NULL,
      "query" TEXT,
      "url" TEXT,
      "sourceName" TEXT NOT NULL,
      "isEnabled" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NewsSourceConfig_pkey" PRIMARY KEY ("id")
    )`);
  await exec(`
    CREATE INDEX IF NOT EXISTS "NewsSourceConfig_topic_isEnabled_idx"
      ON "NewsSourceConfig"("topic", "isEnabled")`);

  await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3)`);
  await exec(
    `UPDATE "User" SET "emailVerified" = "createdAt" WHERE "emailVerified" IS NULL`
  );

  await exec(`
    CREATE TABLE IF NOT EXISTS "EmailVerification" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "EmailVerification_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerification_userId_key" ON "EmailVerification"("userId")`
  );
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerification_tokenHash_key" ON "EmailVerification"("tokenHash")`
  );

  await exec(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0`);
  await exec(`CREATE INDEX IF NOT EXISTS "Post_likeCount_idx" ON "Post"("likeCount")`);

  await exec(`
    CREATE TABLE IF NOT EXISTS "PostLike" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "postId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PostLike_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PostLike_postId_fkey"
        FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "PostLike_userId_postId_key" ON "PostLike"("userId", "postId")`
  );
  await exec(`CREATE INDEX IF NOT EXISTS "PostLike_postId_idx" ON "PostLike"("postId")`);

  await exec(`
    CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT NOT NULL,
      "participantAId" TEXT NOT NULL,
      "participantBId" TEXT NOT NULL,
      "contextPostId" TEXT,
      "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Conversation_participantAId_fkey"
        FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Conversation_participantBId_fkey"
        FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_participantAId_participantBId_key"
      ON "Conversation"("participantAId", "participantBId")`
  );

  await exec(`
    CREATE TABLE IF NOT EXISTS "DirectMessage" (
      "id" TEXT NOT NULL,
      "conversationId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "readAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "DirectMessage_conversationId_fkey"
        FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "DirectMessage_senderId_fkey"
        FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
  await exec(
    `CREATE INDEX IF NOT EXISTS "DirectMessage_conversationId_createdAt_idx"
      ON "DirectMessage"("conversationId", "createdAt")`
  );

  await exec(`
    CREATE TABLE IF NOT EXISTS "Bookmark" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "postId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Bookmark_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Bookmark_postId_fkey"
        FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Bookmark_userId_postId_key"
      ON "Bookmark"("userId", "postId")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Bookmark_userId_idx" ON "Bookmark"("userId")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Bookmark_postId_idx" ON "Bookmark"("postId")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Bookmark_createdAt_idx" ON "Bookmark"("createdAt")`
  );

  await exec(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT,
      "href" TEXT,
      "isRead" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Notification_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`);
  await exec(
    `CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx"
      ON "Notification"("userId", "isRead")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
      ON "Notification"("userId", "createdAt")`
  );

  await exec(
    `ALTER TABLE "Comment" ADD COLUMN IF NOT EXISTS "parentId" TEXT`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "Comment_parentId_idx" ON "Comment"("parentId")`
  );

  await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`);

  await exec(`
    CREATE TABLE IF NOT EXISTS "SearchQueryStat" (
      "id" TEXT NOT NULL,
      "query" TEXT NOT NULL,
      "count" INTEGER NOT NULL DEFAULT 1,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SearchQueryStat_pkey" PRIMARY KEY ("id")
    )`);
  await exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS "SearchQueryStat_query_key"
      ON "SearchQueryStat"("query")`
  );
  await exec(
    `CREATE INDEX IF NOT EXISTS "SearchQueryStat_count_idx"
      ON "SearchQueryStat"("count")`
  );

  await exec(`ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "region" TEXT`);
  await exec(
    `CREATE INDEX IF NOT EXISTS "Post_region_idx" ON "Post"("region")`
  );

  const critical = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Post'
      AND column_name IN ('likeCount', 'isAutomated', 'ingestedAt')`;
  const cols = new Set(critical.map((r) => r.column_name));
  for (const need of ["likeCount", "isAutomated", "ingestedAt"] as const) {
    if (!cols.has(need)) {
      throw new Error(`[pg-patch] 필수 컬럼 Post.${need} 없음`);
    }
  }

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('NewsIngestRun', 'Post', 'Category')`;
  const tableSet = new Set(tables.map((r) => r.tablename));
  for (const need of ["NewsIngestRun", "Post", "Category"] as const) {
    if (!tableSet.has(need)) {
      throw new Error(`[pg-patch] 필수 테이블 ${need} 없음`);
    }
  }

  await prisma.$disconnect();
  console.log("[pg-patch] 완료 (Post·NewsIngestRun·Category 검증 OK)");
}

main().catch((err) => {
  console.error("[pg-patch] 실패", err);
  process.exit(1);
});
