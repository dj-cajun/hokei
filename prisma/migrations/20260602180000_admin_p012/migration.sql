-- P0–P2: ingest metadata, post moderation, comment hide

ALTER TABLE "Post" ADD COLUMN "moderationStatus" TEXT NOT NULL DEFAULT 'VISIBLE';
ALTER TABLE "Post" ADD COLUMN "moderatedAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "moderatedById" TEXT;
ALTER TABLE "Post" ADD COLUMN "moderationNote" TEXT;

ALTER TABLE "Comment" ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Comment" ADD COLUMN "hiddenAt" DATETIME;
ALTER TABLE "Comment" ADD COLUMN "hiddenById" TEXT;

ALTER TABLE "NewsIngestRun" ADD COLUMN "errorDetails" TEXT;
ALTER TABLE "NewsIngestRun" ADD COLUMN "durationMs" INTEGER;
ALTER TABLE "NewsIngestRun" ADD COLUMN "triggeredBy" TEXT;

CREATE INDEX "Post_moderationStatus_idx" ON "Post"("moderationStatus");
CREATE INDEX "Comment_isHidden_idx" ON "Comment"("isHidden");
