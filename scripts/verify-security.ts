/**
 * 보안 헤더·필수 env 스모크
 * npm run verify
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";

const root = process.cwd();
let failed = false;

function fail(msg: string) {
  console.error(`[verify] ${msg}`);
  failed = true;
}

function ok(msg: string) {
  console.log(`[verify] OK ${msg}`);
}

const nextConfig = readFileSync(path.join(root, "next.config.ts"), "utf8");
const requiredHeaders = [
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
];

for (const h of requiredHeaders) {
  if (nextConfig.includes(h)) ok(`header ${h}`);
  else fail(`next.config.ts에 ${h} 없음`);
}

if (nextConfig.includes("CRON_SECRET") || nextConfig.includes("cron")) {
  ok("cron 관련 설정 확인");
}

const envCheck = spawnSync("npm", ["run", "env:check"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
if (envCheck.status !== 0) failed = true;

const gitignore = existsSync(path.join(root, ".gitignore"))
  ? readFileSync(path.join(root, ".gitignore"), "utf8")
  : "";
if (gitignore.includes(".env")) ok(".env gitignore");
else fail(".gitignore에 .env 없음");

if (failed) process.exit(1);
console.log("\n[verify] 통과");
