/**
 * 프로덕션 DB 마이그레이션 (Neon) — Vercel production env 사용
 * npm run db:migrate:prod
 */
import { execSync } from "child_process";

process.env.PRISMA_SCHEMA = "prisma/schema.postgresql.prisma";

console.log("[migrate-prod] Vercel production DATABASE_URL로 migrate deploy …");
execSync(
  "npx vercel env run --environment production -- npx prisma migrate deploy",
  {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  }
);
console.log("[migrate-prod] 완료");
