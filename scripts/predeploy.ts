/**
 * 배포 전 자동 점검
 * npm run predeploy
 */
import { spawnSync } from "child_process";

const production = process.argv.includes("--production");

function run(cmd: string, args: string[] = []) {
  console.log(`\n[predeploy] $ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });
  if (r.status !== 0) {
    console.error(`[predeploy] 실패: ${cmd}`);
    process.exit(r.status ?? 1);
  }
}

console.log(
  production
    ? "[predeploy] 프로덕션 배포 전 점검"
    : "[predeploy] 로컬 배포 준비 점검"
);

run("npx", ["tsx", "scripts/check-env.ts", ...(production ? ["--production"] : [])]);
run("npm", ["run", "verify"]);
run("npm", ["run", "lint"]);
run("npm", ["run", "test"]);
run("npx", ["prisma", "generate"]);
run("npm", ["run", "build"]);

if (!production) {
  const db = process.env.DATABASE_URL ?? "";
  if (db.startsWith("file:")) {
    run("npm", ["run", "search:reindex"]);
  }
}

console.log(`
[predeploy] 모든 점검 통과

배포 직전 Vercel 환경 변수: npm run vercel:env
가이드: docs/DEPLOY.md
`);
