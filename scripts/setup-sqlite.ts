/**
 * SQLite 로컬 초기 설정 (Cursor 터미널: npm run setup)
 */
import { existsSync } from "fs";
import path from "path";
import { run } from "./lib/run";

const dbFile =
  process.env.DATABASE_URL?.replace(/^file:/, "") ?? "dev.db";
const dbPath = path.isAbsolute(dbFile)
  ? dbFile
  : path.join(process.cwd(), dbFile);

console.log("[setup] SQLite 로컬 개발 환경 설정");
console.log("[setup] DB:", dbPath);

run("npx tsx scripts/prisma-generate-for-deploy.ts");

if (!existsSync(dbPath)) {
  console.log("[setup] DB 파일 없음 → prisma db push");
  run("npx prisma db push");
} else {
  console.log("[setup] 기존 DB 유지 (스키마 변경 시: npm run db:push)");
}

run("npm run db:seed");
run("npm run search:reindex");

console.log(`
[setup] 완료
  개발 서버:  npm run dev
  브라우저:   http://localhost:3001
  테스트 계정: admin@hokei.vn / admin1234
`);
