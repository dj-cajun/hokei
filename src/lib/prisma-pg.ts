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
  const pool = new Pool({
    connectionString: normalizePostgresConnectionString(connectionString),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
