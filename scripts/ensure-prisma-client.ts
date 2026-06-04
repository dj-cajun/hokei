/**
 * DATABASE_URL과 생성된 Prisma Client provider 불일치 시 자동 재생성 (로컬 dev)
 */
import { spawnSync } from "child_process";
import { getGeneratedPrismaActiveProvider } from "../src/lib/prisma-generated-provider";
import {
  isPostgresDatabaseUrl,
  resolveDatabaseUrlForPrismaGenerate,
} from "../src/lib/read-env-file";

const url = resolveDatabaseUrlForPrismaGenerate();
const expected = isPostgresDatabaseUrl(url) ? "postgresql" : "sqlite";
const actual = getGeneratedPrismaActiveProvider();

if (actual === expected) {
  console.log(`[prisma] Client provider=${actual} (ok)`);
  process.exit(0);
}

console.warn(
  `[prisma] Client provider=${actual} ≠ DATABASE_URL(${expected}) → 재생성`
);
const r = spawnSync("npx", ["tsx", "scripts/prisma-generate-for-deploy.ts"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
