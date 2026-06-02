import { loadDotenv } from "@/lib/load-dotenv";

loadDotenv();

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { PRISMA_DATASOURCE_PROVIDER } from "@/lib/prisma-datasource";
import { createPostgresPrisma } from "@/lib/prisma-pg";

function resolveConnectionString(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
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
  if (PRISMA_DATASOURCE_PROVIDER !== runtime) {
    throw new Error(
      [
        `Prisma Client(provider=${PRISMA_DATASOURCE_PROVIDER})와 DATABASE_URL(${runtime})이 맞지 않습니다.`,
        `다음을 실행하세요: npx tsx scripts/prisma-generate-for-deploy.ts`,
        `로컬 SQLite: DATABASE_URL="file:./dev.db"`,
        `Neon/프로덕션: DATABASE_URL="postgresql://..."`,
      ].join("\n")
    );
  }
}

function createPrismaClient(): PrismaClient {
  assertProviderMatchesUrl();

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (getRuntimeDatabaseKind() === "postgresql") {
    return createPostgresPrisma(connectionString);
  }

  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  return new PrismaClient({ adapter });
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

if (process.env.NODE_ENV !== "production") {
  getPrisma();
}
