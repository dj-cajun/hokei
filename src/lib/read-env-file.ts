import { existsSync, readFileSync } from "fs";
import { parse } from "dotenv";

/** `.env` 파일에서 단일 키 읽기 (따옴표 제거) */
export function readEnvFileValue(key: string): string {
  if (!existsSync(".env")) return "";
  const parsed = parse(readFileSync(".env", "utf8"));
  const raw = parsed[key];
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

export function isPostgresDatabaseUrl(url: string): boolean {
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

/** 로컬 dev: 쉘 Postgres + .env SQLite일 때 file 우선 */
export function resolveLocalDevDatabaseUrl(
  fromProcess: string,
  fromFile: string
): string {
  if (
    fromFile.startsWith("file:") &&
    isPostgresDatabaseUrl(fromProcess)
  ) {
    return fromFile;
  }
  return fromProcess || fromFile || "file:./dev.db";
}

/**
 * Prisma generate용 DATABASE_URL.
 * 로컬에서 쉘에 남은 Neon URL이 .env SQLite를 덮지 않도록 .env file: 우선.
 */
export function resolveDatabaseUrlForPrismaGenerate(): string {
  const fromProcess = process.env.DATABASE_URL?.trim() ?? "";
  const fromFile = readEnvFileValue("DATABASE_URL");
  const onVercel = process.env.VERCEL === "1";
  const onCi = process.env.CI === "true" || process.env.CI === "1";

  if (onCi && fromProcess) return fromProcess;

  if (!onVercel) {
    // with-pg-env / --neon: 쉘의 Neon URL 우선 (.env file:./dev.db 덮어쓰기 방지)
    if (process.env.PRISMA_USE_SHELL_DATABASE_URL === "1" && fromProcess) {
      return fromProcess;
    }
    const url = resolveLocalDevDatabaseUrl(fromProcess, fromFile);
    if (
      url === fromFile &&
      fromFile.startsWith("file:") &&
      isPostgresDatabaseUrl(fromProcess)
    ) {
      console.warn(
        "[prisma-generate] 쉘 DATABASE_URL(Postgres) → .env SQLite 사용 (로컬 dev)"
      );
    }
    return url;
  }

  // Vercel: process env만 사용 (배포물 .env·SQLite 폴백으로 빈 DB 연결 방지)
  return fromProcess || "";
}
