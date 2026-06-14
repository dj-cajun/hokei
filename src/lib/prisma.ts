import { loadDotenv } from "@/lib/load-dotenv";

loadDotenv();

import { existsSync } from "fs";
import { PrismaClient } from "@/generated/prisma/client";
import { PRISMA_DATASOURCE_PROVIDER } from "@/lib/prisma-datasource";
import { getGeneratedPrismaActiveProvider } from "@/lib/prisma-generated-provider";
import { createPostgresPrisma } from "@/lib/prisma-pg";
import { resolveDatabaseUrlForPrismaGenerate } from "@/lib/read-env-file";

function resolveConnectionString(): string {
  const url = resolveDatabaseUrlForPrismaGenerate();
  if (url) return url;
  if (
    PRISMA_DATASOURCE_PROVIDER === "sqlite" &&
    existsSync("dev.db")
  ) {
    return "file:./dev.db";
  }
  if (process.env.VERCEL === "1") return "";
  if (PRISMA_DATASOURCE_PROVIDER === "sqlite") return "file:./dev.db";
  throw new Error(
    "DATABASE_URL이 비어 있습니다. .env에 postgresql://… 또는 로컬 SQLite용 file:./dev.db 를 설정하세요."
  );
}

const connectionString = resolveConnectionString();

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaConnectionKind?: "sqlite" | "postgresql";
};

function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

function getRuntimeDatabaseKind(): "sqlite" | "postgresql" {
  return isPostgresUrl(connectionString) ? "postgresql" : "sqlite";
}

function assertProviderMatchesUrl(): void {
  const runtime = getRuntimeDatabaseKind();
  const generated = getGeneratedPrismaActiveProvider();
  const onVercel = process.env.VERCEL === "1";

  if (generated !== runtime) {
    throw new Error(
      [
        `생성된 Prisma Client(${generated})와 DATABASE_URL(${runtime})이 맞지 않습니다.`,
        "로컬: npm run dev  또는  npm run db:generate",
        "캐시 초기화: npm run dev:clean",
      ].join("\n")
    );
  }

  // Neon CLI: neon-bootstrap이 marker를 갱신 — 쉘 Postgres URL 우선 시 marker 검사 생략
  const shellPg = process.env.PRISMA_USE_SHELL_DATABASE_URL === "1";
  if (!onVercel && !shellPg && PRISMA_DATASOURCE_PROVIDER !== runtime) {
    throw new Error(
      [
        `prisma-datasource 마커(${PRISMA_DATASOURCE_PROVIDER})와 DATABASE_URL(${runtime})이 맞지 않습니다.`,
        "다음을 실행하세요: npm run db:generate",
        `로컬 SQLite: DATABASE_URL="file:./dev.db"`,
        `Neon/프로덕션: DATABASE_URL="postgresql://..."`,
      ].join("\n")
    );
  }
}

function createSqlitePrismaClient(url: string): PrismaClient {
  // Vercel(Postgres) 런타임에서 네이티브 모듈 로드 방지 — SQLite 경로에서만 require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

function createPrismaClient(): PrismaClient {
  assertProviderMatchesUrl();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (getRuntimeDatabaseKind() === "postgresql") {
    return createPostgresPrisma(connectionString);
  }

  return createSqlitePrismaClient(connectionString);
}

function isValidPrismaClient(
  client: PrismaClient | undefined
): client is PrismaClient {
  return Boolean(client && typeof client.post?.findMany === "function");
}

function getPrisma(): PrismaClient {
  const kind = getRuntimeDatabaseKind();
  const existing = globalForPrisma.prisma;

  if (
    isValidPrismaClient(existing) &&
    globalForPrisma.prismaConnectionKind === kind
  ) {
    return existing;
  }

  if (existing) {
    void (existing as PrismaClient).$disconnect().catch(() => undefined);
  }

  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaConnectionKind = kind;
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

export function getDatabaseKind(): "sqlite" | "postgresql" {
  return getRuntimeDatabaseKind();
}
