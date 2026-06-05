/**
 * 로컬 SQLite(dev.db)에 User.kakaoId·Admin P0~P7 스키마 반영 (db push 없이 SQL만)
 * DATABASE_URL=file:./dev.db npm run db:sqlite:admin-schema
 */
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "dev.db";
if (!dbPath.endsWith(".db") || dbPath.includes("..")) {
  console.error("[db:sqlite:admin-schema] DATABASE_URL=file:./dev.db 로 실행하세요.");
  process.exit(1);
}
if (!existsSync(dbPath)) {
  console.error(`[db:sqlite:admin-schema] DB 없음: ${dbPath}`);
  process.exit(1);
}

const files = [
  "prisma/migrations/20260601203000_user_kakao_id/migration.sql",
  "prisma/migrations/20260602180000_admin_p012/migration.sql",
  "prisma/migrations/20260602200000_admin_p34567/migration.sql",
  "prisma/migrations/20260606120000_email_verification/migration.sql",
];

for (const rel of files) {
  const sql = join(process.cwd(), rel);
  if (!existsSync(sql)) {
    console.error(`[db:sqlite:admin-schema] 없음: ${rel}`);
    process.exit(1);
  }
  const r = spawnSync("sqlite3", [dbPath], {
    input: readFileSync(sql),
    encoding: "utf8",
  });
  if (r.stderr?.trim()) {
    const lines = r.stderr.trim().split("\n");
    const ignorable = lines.every((l) =>
      /duplicate column|already exists/i.test(l)
    );
    if (!ignorable) console.warn(r.stderr.trim());
  }
  console.log(`[db:sqlite:admin-schema] applied ${rel}`);
}

console.log("[db:sqlite:admin-schema] 완료 — dev 서버 재시작 권장");
