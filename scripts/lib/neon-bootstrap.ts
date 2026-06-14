/**
 * Neon CLI — generate 후 동적 import로 Prisma Client 캐시(sqlite) 문제 방지
 *
 * Neon 스크립트는 openNeonPrisma()만 사용하세요.
 * src/lib/prisma 직접 import 금지 (sqlite 캐시·provider 불일치).
 */
import { spawnSync } from "child_process";
import { createRequire } from "module";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { parse } from "dotenv";
import type { PrismaClient } from "../../src/generated/prisma/client";

const require = createRequire(import.meta.url);
const MARKER_PATH = join(process.cwd(), "src/lib/prisma-datasource.ts");

export function readNeonDatabaseUrl(): string {
  const path = ".env.production.pg";
  if (!existsSync(path)) {
    throw new Error("[neon] .env.production.pg 없음");
  }
  const parsed = parse(readFileSync(path, "utf8"));
  const url = (parsed.DATABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!url.startsWith("postgres")) {
    throw new Error("[neon] .env.production.pg DATABASE_URL(PostgreSQL) 필요");
  }
  return url;
}

/** Neon 스크립트용 env — .env.local이 덮지 못하도록 쉘 env 고정 */
export function applyNeonShellEnv(url?: string): string {
  const pgUrl = url ?? readNeonDatabaseUrl();
  process.env.DATABASE_URL = pgUrl;
  process.env.PRISMA_USE_SHELL_DATABASE_URL = "1";
  process.env.PRISMA_SCHEMA = "prisma/schema.postgresql.prisma";
  return pgUrl;
}

function readGeneratedProviderFromDisk(): "sqlite" | "postgresql" | null {
  const classPath = join(
    process.cwd(),
    "src/generated/prisma/internal/class.ts"
  );
  if (!existsSync(classPath)) return null;
  const match = readFileSync(classPath, "utf8").match(
    /"activeProvider":\s*"(sqlite|postgresql)"/
  );
  return match?.[1] === "postgresql" || match?.[1] === "sqlite"
    ? match[1]
    : null;
}

/** generate 직후 이전 sqlite PrismaClient 모듈 캐시 제거 */
export function clearPrismaModuleCache(): void {
  for (const key of Object.keys(require.cache)) {
    if (
      key.includes(`${join(process.cwd(), "src/generated/prisma")}`) ||
      key.includes(`${join(process.cwd(), "src/lib/prisma-pg")}`) ||
      key.includes(`${join(process.cwd(), "src/lib/prisma.ts")}`)
    ) {
      delete require.cache[key];
    }
  }
}

function writePostgresMarker(): void {
  const marker = `/** 자동 생성 — scripts/lib/neon-bootstrap.ts (직접 수정하지 마세요) */
export type PrismaDatasourceProvider = "sqlite" | "postgresql";

export const PRISMA_DATASOURCE_PROVIDER: PrismaDatasourceProvider = "postgresql";
`;
  writeFileSync(MARKER_PATH, marker, "utf8");
}

/** deploy용 pg-patch 없이 generate만 (Neon 수집·백필용) */
export function generateNeonPrismaClient(): void {
  console.log("[neon] PostgreSQL Prisma Client 생성…");
  const r = spawnSync("npx", ["prisma", "generate"], {
    stdio: "inherit",
    env: { ...process.env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  writePostgresMarker();
  clearPrismaModuleCache();
  console.log("[neon] Prisma Client 준비 완료");
}

/** generate → 캐시 제거 → pg adapter (src/lib/prisma.ts 우회) */
export async function openNeonPrisma(options?: {
  skipGenerate?: boolean;
}): Promise<PrismaClient> {
  const url = applyNeonShellEnv();
  const onDisk = readGeneratedProviderFromDisk();
  const needGenerate =
    !options?.skipGenerate || onDisk !== "postgresql";

  if (needGenerate) {
    if (options?.skipGenerate && onDisk !== "postgresql") {
      console.log("[neon] sqlite client 감지 — PostgreSQL용 재생성");
    }
    generateNeonPrismaClient();
  } else {
    clearPrismaModuleCache();
  }

  const { createPostgresPrisma } = await import("../../src/lib/prisma-pg");
  return createPostgresPrisma(url);
}

export async function pingNeonDb(
  prisma: PrismaClient,
  label = "neon"
): Promise<void> {
  console.log(`[${label}] DB 연결 확인 중… (최대 15초)`);
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[${label}] DB 연결 OK (${Date.now() - t0}ms)`);
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`[${label}] DB 연결 실패 (${Date.now() - t0}ms): ${msg}`);
    throw new Error(
      `[${label}] Neon 연결 실패. VPN·네트워크·.env.production.pg URL을 확인하세요.\n${msg}`
    );
  }
}

export function restoreLocalSqlitePrisma(): void {
  console.log("[neon] 로컬 SQLite Prisma Client 복구…");
  delete process.env.PRISMA_USE_SHELL_DATABASE_URL;
  delete process.env.PRISMA_SCHEMA;
  process.env.DATABASE_URL = "file:./dev.db";
  const r = spawnSync("npx", ["tsx", "scripts/prisma-generate-for-deploy.ts"], {
    stdio: "inherit",
    env: { ...process.env },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  clearPrismaModuleCache();
}
