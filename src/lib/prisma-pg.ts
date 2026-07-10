import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

/** pg v8+ SSL 경고 방지 — require/prefer/verify-ca → verify-full */
export function normalizePostgresConnectionString(
  connectionString: string
): string {
  try {
    const url = new URL(connectionString);
    const mode = url.searchParams.get("sslmode");
    if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    return connectionString.replace(
      /([?&]sslmode=)(require|prefer|verify-ca)(?=&|$)/,
      "$1verify-full"
    );
  }
  return connectionString;
}

export function createPostgresPrisma(connectionString: string): PrismaClient {
  const isDev = process.env.NODE_ENV === "development";
  const connectionTimeoutMillis = isDev ? 60_000 : 15_000;

  const pool = new Pool({
    connectionString: normalizePostgresConnectionString(connectionString),
    connectionTimeoutMillis,
    // dev: 동시 4쿼리가 각각 새 연결을 열면 라오스→Neon에서 타임아웃 — 풀 작게 유지
    max: isDev ? 3 : 10,
    idleTimeoutMillis: 30_000,
    ssl:
      connectionString.includes("neon.tech") ||
      connectionString.includes("supabase.co") ||
      connectionString.includes("pooler.supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
