/**
 * PostgreSQL(Docker) 초기 설정 (Cursor 터미널: npm run setup:pg)
 */
import { run } from "./lib/run";
import { waitForPostgres } from "./lib/wait-postgres";

const PG_URL =
  process.env.DATABASE_URL ??
  "postgresql://hokei:hokei_local@localhost:5432/hokei";

async function main() {
  console.log(
    "[setup:pg] URL:",
    PG_URL.replace(/:[^:@]+@/, ":****@")
  );

  run("docker compose up -d postgres");
  await waitForPostgres();

  run("npx prisma generate", {
    PRISMA_SCHEMA: "prisma/schema.prisma",
    DATABASE_URL: PG_URL,
  });

  run("npx prisma db push", {
    PRISMA_SCHEMA: "prisma/schema.prisma",
    DATABASE_URL: PG_URL,
  });

  run("npm run db:seed", { DATABASE_URL: PG_URL });

  run("npm run search:pg:setup", { DATABASE_URL: PG_URL });

  console.log(`
[setup:pg] 완료
  1) .env 에 추가:
     DATABASE_URL="${PG_URL}"
  2) Prisma 클라이언트 (PG):
     npm run db:pg:generate
  3) 개발 서버:
     npm run dev
`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
