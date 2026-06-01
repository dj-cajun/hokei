/**
 * DATABASE_URL에 맞는 Prisma Client 생성 (Vercel·로컬 공통)
 */
import { spawnSync } from "child_process";

const url = process.env.DATABASE_URL?.trim() ?? "";
const schema =
  url.startsWith("postgresql://") || url.startsWith("postgres://")
    ? "prisma/schema.postgresql.prisma"
    : "prisma/schema.prisma";

console.log(`[prisma-generate] schema=${schema}`);

const r = spawnSync("npx", ["prisma", "generate"], {
  stdio: "inherit",
  env: { ...process.env, PRISMA_SCHEMA: schema },
});

process.exit(r.status ?? 1);
