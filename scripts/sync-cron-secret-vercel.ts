/**
 * CRON_SECRET만 Vercel Production에 동기화 + 재배포 안내
 * npm run env:cron-secret && npm run vercel:cron-secret
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
if (!existsSync(envPath)) {
  console.error("[vercel:cron-secret] .env 없음");
  process.exit(1);
}

const m = readFileSync(envPath, "utf8").match(/^CRON_SECRET=(.+)$/m);
if (!m) {
  console.error("[vercel:cron-secret] CRON_SECRET 없음 — npm run env:cron-secret");
  process.exit(1);
}

let secret = m[1]!.trim();
if (
  (secret.startsWith('"') && secret.endsWith('"')) ||
  (secret.startsWith("'") && secret.endsWith("'"))
) {
  secret = secret.slice(1, -1);
}

if (secret.length < 16) {
  console.error("[vercel:cron-secret] CRON_SECRET 16자 이상 필요");
  process.exit(1);
}

const r = spawnSync("npx", ["vercel", "env", "add", "CRON_SECRET", "production", "--force"], {
  input: secret,
  encoding: "utf8",
  cwd: process.cwd(),
  stdio: ["pipe", "pipe", "pipe"],
});

if (r.status !== 0) {
  console.error("[vercel:cron-secret] 실패:", (r.stderr || r.stdout || "").trim());
  process.exit(1);
}

console.log("[vercel:cron-secret] Vercel Production CRON_SECRET 동기화 완료");
console.log("[vercel:cron-secret] 다음: npm run vercel:deploy");
