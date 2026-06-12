/**
 * 권장 배포: git push → Vercel Git 연동 자동 배포 (CLI 토큰 불필요)
 * npm run deploy
 */
import { spawnSync } from "child_process";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://hokei-peach.vercel.app";

function run(cmd: string, args: string[] = [], inherit = false) {
  const r = spawnSync(cmd, args, {
    stdio: inherit ? "inherit" : "pipe",
    encoding: "utf8",
    shell: false,
    cwd: process.cwd(),
  });
  return r;
}

function git(args: string[]): string {
  const r = run("git", args);
  if (r.status !== 0) {
    console.error(`[deploy] git ${args.join(" ")} 실패`);
    process.exit(r.status ?? 1);
  }
  return (r.stdout ?? "").trim();
}

const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
const dirty = git(["status", "--porcelain"]);

if (dirty) {
  console.error(`
[deploy] 커밋되지 않은 변경이 있습니다. 먼저 commit 하세요.

${dirty}
`);
  process.exit(1);
}

if (branch !== "main" && branch !== "master") {
  console.warn(`[deploy] 현재 브랜치: ${branch} (보통 main에 push)`);
}

let ahead = "0";
const upstream = run("git", ["rev-parse", "--abbrev-ref", "@{u}"]);
if (upstream.status !== 0) {
  ahead = "1";
} else {
  const upstreamRef = (upstream.stdout ?? "").trim();
  ahead = git(["rev-list", "--count", `${upstreamRef}..HEAD`]);
}
if (ahead === "0") {
  console.log("[deploy] push할 새 커밋이 없습니다. 이미 origin과 동기화됨.");
  console.log(`[deploy] 사이트: ${SITE_URL}`);
  process.exit(0);
}

console.log(`[deploy] ${ahead}개 커밋을 origin/${branch}에 push → Vercel 자동 배포\n`);

const push = run("git", ["push", "-u", "origin", "HEAD"], true);
if (push.status !== 0) {
  process.exit(push.status ?? 1);
}

console.log(`
[deploy] push 완료 — Vercel이 GitHub 훅으로 배포를 시작합니다 (CLI 토큰 불필요).

  사이트: ${SITE_URL}
  CI:     https://github.com/dj-cajun/hokei/actions

수동 CLI 배포가 필요할 때만: npm run vercel:deploy
`);
