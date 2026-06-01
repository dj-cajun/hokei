/**
 * SQLite dev.db → PostgreSQL 데이터 이전 (2단계: export → import)
 * npm run db:migrate:sqlite-to-pg
 */
import "dotenv/config";
import { spawnSync } from "child_process";

const pgUrl = process.env.DATABASE_URL ?? "";

if (!pgUrl.startsWith("postgresql://") && !pgUrl.startsWith("postgres://")) {
  console.error(
    "[migrate] DATABASE_URL을 PostgreSQL로 설정한 뒤 실행하세요."
  );
  process.exit(1);
}

function run(script: string) {
  const r = spawnSync("npx", ["tsx", script], {
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("scripts/migrate-sqlite-to-pg-export.ts");
run("scripts/migrate-sqlite-to-pg-import.ts");
console.log("[migrate] 완료 — npm run search:pg:setup 권장");
