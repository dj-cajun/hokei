/**
 * Vercel CLI 수동 배포 전 인증 확인
 * npm run vercel:deploy 가 자동 실행
 */
import { spawnSync } from "child_process";

function runVercelWhoami(): { ok: boolean; out: string } {
  const r = spawnSync("npx", ["vercel", "whoami"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  return { ok: r.status === 0, out };
}

const staleToken = Boolean(process.env.VERCEL_TOKEN?.trim());
let { ok, out } = runVercelWhoami();

if (!ok && staleToken) {
  console.warn(
    "[vercel] VERCEL_TOKEN 환경 변수가 만료됐을 수 있습니다. 세션 로그인으로 재시도합니다."
  );
  const env = { ...process.env };
  delete env.VERCEL_TOKEN;
  const r = spawnSync("npx", ["vercel", "whoami"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
    env,
  });
  out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  ok = r.status === 0;
  if (ok) {
    console.warn(
      "[vercel] .env·쉘의 VERCEL_TOKEN을 제거하세요. `npx vercel login`만 쓰면 만료 시 재로그인으로 충분합니다."
    );
  }
}

if (!ok) {
  console.error(`
[vercel] CLI 인증 실패 — 수동 배포를 중단합니다.

해결:
  1. npx vercel login          # 브라우저로 재로그인 (권장)
  2. unset VERCEL_TOKEN        # 만료된 토큰 env가 있으면 제거
  3. npm run deploy            # CLI 없이 git push → Vercel 자동 배포 (권장)

${out ? `출력: ${out}\n` : ""}`);
  process.exit(1);
}

const account =
  out
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("Vercel CLI") && !l.startsWith(">")) ??
  out;
console.log(`[vercel] CLI 인증 OK (${account})`);
