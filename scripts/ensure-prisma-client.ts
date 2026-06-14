/**
 * 생성된 Prisma Client가 없으면 생성 (단일 PostgreSQL).
 */
import { existsSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const clientDir = join(process.cwd(), "src/generated/prisma");
const hasClient =
  existsSync(join(clientDir, "client.ts")) ||
  existsSync(join(clientDir, "client.js"));

if (hasClient) {
  console.log("[prisma] Client 존재 (ok)");
  process.exit(0);
}

console.log("[prisma] Client 없음 → 생성");
const r = spawnSync("npx", ["tsx", "scripts/prisma-generate-for-deploy.ts"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
