import { config } from "dotenv";
import { existsSync } from "fs";

/** `.env` → `.env.local` (local 우선). Neon 스크립트는 DATABASE_URL 보존 */
export function loadDotenv(): void {
  const preservePg =
    process.env.PRISMA_USE_SHELL_DATABASE_URL === "1"
      ? process.env.DATABASE_URL?.trim()
      : undefined;

  if (existsSync(".env")) config({ path: ".env", override: false });
  if (existsSync(".env.local")) config({ path: ".env.local", override: true });

  if (
    preservePg &&
    (preservePg.startsWith("postgresql://") || preservePg.startsWith("postgres://"))
  ) {
    process.env.DATABASE_URL = preservePg;
  }
}
