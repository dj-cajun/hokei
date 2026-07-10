import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

function isManagedCloudPostgres(connectionString: string): boolean {
  return (
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co") ||
    connectionString.includes("pooler.supabase.com")
  );
}

/**
 * pg v8.21+ 는 sslmode=require|prefer|verify-ca 를 verify-full 로 취급한다.
 * 그 경우 Pool 의 ssl.rejectUnauthorized=false 가 무시되어(빈 ssl 객체)
 * Supabase/Neon 중간 인증서에서 TLS 실패한다 → managed 는 no-verify 로 고정.
 */
export function normalizePostgresConnectionString(
  connectionString: string
): string {
  if (isManagedCloudPostgres(connectionString)) {
    try {
      const url = new URL(connectionString);
      url.searchParams.set("sslmode", "no-verify");
      return url.toString();
    } catch {
      if (/[?&]sslmode=/.test(connectionString)) {
        return connectionString.replace(
          /([?&]sslmode=)[^&]*/g,
          "$1no-verify"
        );
      }
      return (
        connectionString +
        (connectionString.includes("?") ? "&" : "?") +
        "sslmode=no-verify"
      );
    }
  }
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
  const managed = isManagedCloudPostgres(connectionString);

  const pool = new Pool({
    connectionString: normalizePostgresConnectionString(connectionString),
    connectionTimeoutMillis,
    // dev: 동시 4쿼리가 각각 새 연결을 열면 라오스→Neon에서 타임아웃 — 풀 작게 유지
    max: isDev ? 3 : 10,
    idleTimeoutMillis: 30_000,
    ssl: managed ? { rejectUnauthorized: false } : undefined,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
