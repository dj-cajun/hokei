-- CreateEnum
CREATE TYPE "LifeGuideKind" AS ENUM ('PHRASE', 'DOC');

-- CreateEnum
CREATE TYPE "LifeDomain" AS ENUM ('CLOTHES', 'FOOD', 'HOUSING', 'ADMIN', 'TRANSPORT', 'EDUCATION');

-- CreateEnum
CREATE TYPE "TimelineCategory" AS ENUM ('DELIVERY', 'GROCERY', 'FLEA_MARKET');

-- CreateTable
CREATE TABLE "LifeGuide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "LifeGuideKind" NOT NULL,
    "domain" "LifeDomain" NOT NULL,
    "title" TEXT NOT NULL,
    "vnText" TEXT,
    "body" TEXT NOT NULL,
    "audioUrl" TEXT,
    "fileUrl" TEXT,
    "sourceLabel" TEXT,
    "externalUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "kakaoLink" TEXT NOT NULL,
    "category" "TimelineCategory" NOT NULL,
    "region" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LifeGuide_slug_key" ON "LifeGuide"("slug");

-- CreateIndex
CREATE INDEX "LifeGuide_domain_kind_idx" ON "LifeGuide"("domain", "kind");

-- CreateIndex
CREATE INDEX "LifeGuide_sortOrder_idx" ON "LifeGuide"("sortOrder");

-- CreateIndex
CREATE INDEX "LifeGuide_publishedAt_idx" ON "LifeGuide"("publishedAt");

-- CreateIndex
CREATE INDEX "TimelineEntry_category_createdAt_idx" ON "TimelineEntry"("category", "createdAt");

-- CreateIndex
CREATE INDEX "TimelineEntry_createdAt_idx" ON "TimelineEntry"("createdAt");
