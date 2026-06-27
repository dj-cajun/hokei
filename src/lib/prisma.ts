import { loadDotenv } from "@/lib/load-dotenv";

loadDotenv();

import { PrismaClient } from "@/generated/prisma/client";
import { createPostgresPrisma } from "@/lib/prisma-pg";
import { isPostgresDatabaseUrl } from "@/lib/read-env-file";

// 모듈 로드 시점에는 던지지 않는다 (next build의 page-data 수집·테스트에서 import만 해도
// 터지는 것을 방지). 실제 쿼리 시점(getPrisma)에 검증.
function resolveConnectionString(): string {
  const url = process.env.DATABASE_URL?.trim() ?? "";

  if (!url) {
    throw new Error(
      [
        "DATABASE_URL이 비어 있습니다.",
        "이 프로젝트는 Neon PostgreSQL 단일 DB를 사용합니다.",
        '.env에 DATABASE_URL="postgresql://…" 를 설정하세요 (로컬은 Neon dev 브랜치 권장).',
      ].join("\n")
    );
  }

  if (!isPostgresDatabaseUrl(url)) {
    throw new Error(
      [
        `DATABASE_URL이 PostgreSQL이 아닙니다: ${url.slice(0, 16)}…`,
        "이 프로젝트는 Neon PostgreSQL 단일 DB를 사용합니다 (SQLite 미지원).",
      ].join("\n")
    );
  }

  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function isValidPrismaClient(
  client: PrismaClient | undefined
): client is PrismaClient {
  return Boolean(
    client &&
      typeof client.post?.findMany === "function" &&
      typeof client.appSetting?.findUnique === "function" &&
      typeof client.user?.findUnique === "function"
  );
}

function getPrisma(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (isValidPrismaClient(existing)) {
    return existing;
  }

  globalForPrisma.prisma = createPostgresPrisma(resolveConnectionString());
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

/**
 * 단일 Postgres DB를 사용하므로 항상 "postgresql".
 * 반환 타입은 기존 호출부(`!== "sqlite"` 비교) 호환을 위해 유니온 유지.
 */
export function getDatabaseKind(): "sqlite" | "postgresql" {
  return "postgresql";
}
