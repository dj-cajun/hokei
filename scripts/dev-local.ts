/**
 * 로컬 dev: 쉘에 남은 Neon URL·PRISMA_USE_SHELL_DATABASE_URL 제거 후 SQLite로 dev 서버 기동
 */
import { spawnSync } from "child_process";
import { loadDotenv } from "../src/lib/load-dotenv";
import { resolveDatabaseUrlForPrismaGenerate } from "../src/lib/read-env-file";

loadDotenv();

delete process.env.PRISMA_USE_SHELL_DATABASE_URL;

const url = resolveDatabaseUrlForPrismaGenerate();
if (url) {
  process.env.DATABASE_URL = url;
}

function run(cmd: string, args: string[]): number {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

if (run("npx", ["tsx", "scripts/ensure-prisma-client.ts"]) !== 0) {
  process.exit(1);
}

process.exit(run("npx", ["next", "dev", "-p", "3001"]));
