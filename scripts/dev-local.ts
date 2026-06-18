/**
 * 로컬 dev: Neon PostgreSQL(.env)로 next dev 기동
 */
import { spawnSync } from "child_process";
import { loadDotenv } from "../src/lib/load-dotenv";
import { isPostgresDatabaseUrl } from "../src/lib/read-env-file";

loadDotenv();

delete process.env.PRISMA_USE_SHELL_DATABASE_URL;

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!isPostgresDatabaseUrl(url)) {
  console.error(`
[dev] DATABASE_URL이 PostgreSQL이 아닙니다.

  1) .env 에 DATABASE_URL="postgresql://…" (Neon dev 브랜치) 확인
  2) .env.local 에 file:./dev.db 가 남아 있으면 해당 줄 삭제
  3) 터미널에 export DATABASE_URL=file:… 가 남아 있으면 unset DATABASE_URL

  현재: ${url ? url.slice(0, 28) + "…" : "(비어 있음)"}
`);
  process.exit(1);
}

console.log(
  `[dev] DB: ${url.replace(/:[^:@]+@/, ":****@").slice(0, 72)}… (Neon — 첫 페이지 로드 10초+ 걸릴 수 있음)`
);

function run(cmd: string, args: string[]): number {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

async function warmupDatabase(): Promise<void> {
  try {
    const { prisma } = await import("../src/lib/prisma");
    console.log("[dev] Neon 연결 예열 중… (최대 60초)");
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[dev] DB 연결 OK (${Date.now() - t0}ms)`);
  } catch (e) {
    console.warn(
      `[dev] DB 예열 실패 — 첫 페이지가 느리거나 비어 보일 수 있음: ${(e as Error).message}`
    );
  }
}

async function main(): Promise<void> {
  if (run("npx", ["tsx", "scripts/ensure-prisma-client.ts"]) !== 0) {
    process.exit(1);
  }

  await warmupDatabase();

  console.log("[dev] .next 오류(/news 500) 시: npm run dev:clean");

  process.exit(run("npx", ["next", "dev", "-p", "3001"]));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
