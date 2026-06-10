/**
 * DATABASE_URL과 생성된 Prisma Client provider 불일치 시 자동 재생성 (로컬 dev)
 */
import { spawnSync } from "child_process";
import { loadDotenv } from "../src/lib/load-dotenv";
import { PRISMA_DATASOURCE_PROVIDER } from "../src/lib/prisma-datasource";
import { getGeneratedPrismaActiveProvider } from "../src/lib/prisma-generated-provider";
import {
  isPostgresDatabaseUrl,
  resolveDatabaseUrlForPrismaGenerate,
} from "../src/lib/read-env-file";

loadDotenv();

delete process.env.PRISMA_USE_SHELL_DATABASE_URL;

const url = resolveDatabaseUrlForPrismaGenerate();
if (url) {
  process.env.DATABASE_URL = url;
}

const expected = isPostgresDatabaseUrl(url) ? "postgresql" : "sqlite";
const actual = getGeneratedPrismaActiveProvider();
const marker = PRISMA_DATASOURCE_PROVIDER;

if (actual === expected && marker === expected) {
  console.log(`[prisma] Client provider=${actual} (ok)`);
  process.exit(0);
}

console.warn(
  `[prisma] 불일치 → 재생성 (client=${actual}, marker=${marker}, expected=${expected})`
);
const r = spawnSync("npx", ["tsx", "scripts/prisma-generate-for-deploy.ts"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
