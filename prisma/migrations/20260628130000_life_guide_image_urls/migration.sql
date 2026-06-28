-- LifeGuide: 다중 사진 (JSON 배열)
ALTER TABLE "LifeGuide" ADD COLUMN IF NOT EXISTS "imageUrls" JSONB;
