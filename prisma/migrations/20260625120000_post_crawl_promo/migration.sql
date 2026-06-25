-- Post: AI 카톡 큐레이션 + 업소 홍보 타임라인
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isCrawl" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "storeName" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "kakaoLink" TEXT;

CREATE INDEX IF NOT EXISTS "Post_storeName_idx" ON "Post"("storeName");
CREATE INDEX IF NOT EXISTS "Post_isCrawl_idx" ON "Post"("isCrawl");
