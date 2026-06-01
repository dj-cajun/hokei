/**
 * PostgreSQL Prisma 명령 (통합 터미널·Windows/macOS 공통)
 * 사용: tsx scripts/prisma-pg.ts generate | db push | migrate dev
 */
import { run } from "./lib/run";

const PG_URL =
  process.env.DATABASE_URL ??
  "postgresql://hokei:hokei_local@localhost:5432/hokei";

const args = process.argv.slice(2).join(" ");
if (!args) {
  console.error("사용법: npm run db:pg:generate | db:pg:push | db:pg:studio");
  process.exit(1);
}

run(`npx prisma ${args}`, {
  PRISMA_SCHEMA: "prisma/schema.postgresql.prisma",
  DATABASE_URL: PG_URL,
});
