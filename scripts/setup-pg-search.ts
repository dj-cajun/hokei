/**
 * PostgreSQL 전문 검색(tsvector) 컬럼·인덱스 생성
 * npm run search:pg:setup  (DATABASE_URL=postgresql://…)
 */
import "dotenv/config";
import { createPostgresPrisma } from "../src/lib/prisma-pg";

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error("[search:pg:setup] DATABASE_URL이 PostgreSQL이어야 합니다.");
  process.exit(1);
}

const prisma = createPostgresPrisma(url);

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS search_vector tsvector;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS post_search_idx ON "Post" USING GIN (search_vector);
  `);

  const count = await prisma.$executeRaw`
    UPDATE "Post"
    SET search_vector = to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, '')
    )
    WHERE status = 'PUBLISHED'
  `;
  console.log(`[search:pg:setup] 완료 — ${count}건 인덱싱`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
