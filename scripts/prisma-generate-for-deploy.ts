/**
 * DATABASE_URL에 맞는 Prisma Client 생성 (Vercel·로컬 공통)
 */
import { loadDotenv } from "../src/lib/load-dotenv";
import { spawnSync } from "child_process";

loadDotenv();
import { writeFileSync } from "fs";
import { join } from "path";

const url = process.env.DATABASE_URL?.trim() ?? "";
const isPostgres =
  url.startsWith("postgresql://") || url.startsWith("postgres://");
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
  console.log("[prisma-generate] prisma migrate deploy …");
  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, PRISMA_SCHEMA: schema },
  });
  if (migrate.status !== 0) {
    console.warn("[prisma-generate] migrate deploy 실패 — pg-patch 시도");
  }
  const patch = spawnSync("npx", ["tsx", "scripts/pg-apply-schema-patches.ts"], {
    stdio: "inherit",
    env: process.env,
  });
  if (patch.status !== 0) {
    process.exit(patch.status ?? 1);
  }
}

process.exit(0);
