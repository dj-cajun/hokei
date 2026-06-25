/**
 * 생성된 Prisma Client가 없거나 schema보다 오래되면 재생성.
 */
import { existsSync, statSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";

const clientDir = join(process.cwd(), "src/generated/prisma");
const clientFile = join(clientDir, "client.ts");
const schemaFile = join(process.cwd(), "prisma/schema.prisma");

const hasClient = existsSync(clientFile) || existsSync(join(clientDir, "client.js"));

function isClientStale(): boolean {
  if (!hasClient || !existsSync(schemaFile)) return !hasClient;
  try {
    return statSync(schemaFile).mtimeMs > statSync(clientFile).mtimeMs;
  } catch {
    return true;
  }
}

if (hasClient && !isClientStale()) {
  console.log("[prisma] Client 존재 (ok)");
  process.exit(0);
}

console.log(
  hasClient
    ? "[prisma] schema 변경 감지 → Client 재생성"
    : "[prisma] Client 없음 → 생성"
);
const r = spawnSync("npx", ["tsx", "scripts/prisma-generate-for-deploy.ts"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status ?? 1);
