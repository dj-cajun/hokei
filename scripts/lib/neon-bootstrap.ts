/**
 * Neon 스크립트 공용 헬퍼 — 단일 PostgreSQL 구조.
 *
 * .env.production.pg(프로덕션 Neon)로 향하는 Prisma Client를 만든다.
 * (이전의 sqlite 캐시 제거·provider marker 곡예는 단일 DB 전환으로 모두 불필요해져 제거됨)
 */
import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { createPostgresPrisma } from "../../src/lib/prisma-pg";

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

/** Neon 스크립트용 env 고정 (.env.local이 덮지 못하도록) */
export function applyNeonShellEnv(url?: string): string {
  const pgUrl = url ?? readNeonDatabaseUrl();
  process.env.DATABASE_URL = pgUrl;
  return pgUrl;
}

/** Neon(.env.production.pg)으로 향하는 Postgres Prisma Client */
export async function openNeonPrisma(_options?: {
  skipGenerate?: boolean;
}): Promise<PrismaClient> {
  const url = applyNeonShellEnv();
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

/** 단일 Postgres 구조에서는 복구할 로컬 sqlite client가 없다 (호환용 no-op) */
export function restoreLocalSqlitePrisma(): void {}
