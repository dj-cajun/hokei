/**
 * DATABASE_URL에 맞는 Prisma Client 생성 (Vercel·로컬 공통)
 */
import { loadDotenv } from "../src/lib/load-dotenv";
import {
  isPostgresDatabaseUrl,
  resolveDatabaseUrlForPrismaGenerate,
} from "../src/lib/read-env-file";
import { spawnSync } from "child_process";

loadDotenv();
import { writeFileSync } from "fs";
import { join } from "path";

const url = resolveDatabaseUrlForPrismaGenerate();
const onVercel = process.env.VERCEL === "1";

if (onVercel && !isPostgresDatabaseUrl(url)) {
  console.error(
    [
      "[prisma-generate] Vercel 빌드에 postgresql:// DATABASE_URL이 필요합니다.",
      "Vercel → Settings → Environment Variables → DATABASE_URL",
      "→ Production·Preview·Development 모두 체크 (Build 시 postinstall에서 사용)",
      "현재 URL:",
      url ? `${url.slice(0, 24)}…` : "(비어 있음 → SQLite client 생성됨 → 로그인 google_login_failed)",
    ].join("\n")
  );
  process.exit(1);
}

const isPostgres = isPostgresDatabaseUrl(url);
const schema = isPostgres
  ? "prisma/schema.postgresql.prisma"
  : "prisma/schema.prisma";
const provider = isPostgres ? "postgresql" : "sqlite";

console.log(`[prisma-generate] schema=${schema} provider=${provider}`);

const r = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: { ...process.env, PRISMA_SCHEMA: schema },
});

if (r.status !== 0) {
  process.exit(r.status ?? 1);
}

const markerPath = join(process.cwd(), "src/lib/prisma-datasource.ts");
const marker = `/** 자동 생성 — scripts/prisma-generate-for-deploy.ts (직접 수정하지 마세요) */
export type PrismaDatasourceProvider = "sqlite" | "postgresql";

export const PRISMA_DATASOURCE_PROVIDER: PrismaDatasourceProvider = "${provider}";
`;
writeFileSync(markerPath, marker, "utf8");
console.log(`[prisma-generate] wrote ${markerPath}`);

if (isPostgres) {
  // migration_lock.toml=sqlite — PG는 migrate deploy 대신 idempotent pg-patch만 사용
  console.log("[prisma-generate] postgres pg-patch …");
  const patch = spawnSync("npx", ["tsx", "scripts/pg-apply-schema-patches.ts"], {
    stdio: "inherit",
    env: { ...process.env, PRISMA_SCHEMA: schema },
  });
  if (patch.status !== 0) {
    process.exit(patch.status ?? 1);
  }
}

process.exit(0);
