-- LifeGuide: 교민 베트남어 공부 + AI 큐레이션
ALTER TYPE "LifeDomain" ADD VALUE IF NOT EXISTS 'STUDY';

ALTER TABLE "LifeGuide" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "LifeGuide" ADD COLUMN IF NOT EXISTS "isCrawl" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LifeGuide" ADD COLUMN IF NOT EXISTS "authorId" TEXT;

DO $$ BEGIN
  ALTER TABLE "LifeGuide" ADD CONSTRAINT "LifeGuide_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "LifeGuide_authorId_idx" ON "LifeGuide"("authorId");

-- 카톡 타임라인 제거
DROP TABLE IF EXISTS "TimelineEntry";
DROP TYPE IF EXISTS "TimelineCategory";
