/**
 * Prisma Client 생성 (Vercel·로컬 공통) — 단일 PostgreSQL 스키마.
 * 실제 Postgres DB가 연결될 때만 idempotent 스키마 패치를 적용한다.
 */
import { loadDotenv } from "../src/lib/load-dotenv";
import {
  isPostgresDatabaseUrl,
  resolveDatabaseUrlForPrismaGenerate,
} from "../src/lib/read-env-file";
import { spawnSync } from "child_process";

loadDotenv();

const url = resolveDatabaseUrlForPrismaGenerate();
const onVercel = process.env.VERCEL === "1";

if (onVercel && !isPostgresDatabaseUrl(url)) {
  console.error(
    [
      "[prisma-generate] Vercel 빌드에 postgresql:// DATABASE_URL이 필요합니다.",
      "Vercel → Settings → Environment Variables → DATABASE_URL",
      "→ Production·Preview·Development 모두 체크",
      "현재 URL:",
      url ? `${url.slice(0, 24)}…` : "(비어 있음)",
    ].join("\n")
  );
  process.exit(1);
}

console.log("[prisma-generate] schema=prisma/schema.prisma provider=postgresql");

const r = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: process.env,
});

if (r.status !== 0) {
  process.exit(r.status ?? 1);
}

// 실제 Postgres DB가 있을 때만 스키마 패치 (로컬에서 DATABASE_URL 미설정 시 generate만)
if (isPostgresDatabaseUrl(url)) {
  console.log("[prisma-generate] postgres pg-patch …");
  const patch = spawnSync("npx", ["tsx", "scripts/pg-apply-schema-patches.ts"], {
    stdio: "inherit",
    env: process.env,
  });
  if (patch.status !== 0) {
    process.exit(patch.status ?? 1);
  }
}

process.exit(0);
