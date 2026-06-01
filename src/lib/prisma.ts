import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import { createPostgresPrisma } from "@/lib/prisma-pg";

const connectionString =
  process.env.DATABASE_URL?.trim() ||
  (process.env.VERCEL === "1" ? "" : "file:./dev.db");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

function createPrismaClient(): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (isPostgresUrl(connectionString)) {
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
  const existing = globalForPrisma.prisma;
  if (isValidPrismaClient(existing)) return existing;

  if (existing) {
    void (existing as PrismaClient).$disconnect().catch(() => undefined);
  }
  globalForPrisma.prisma = createPrismaClient();
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
  return isPostgresUrl(connectionString) ? "postgresql" : "sqlite";
}

if (process.env.NODE_ENV !== "production") {
  getPrisma();
}
