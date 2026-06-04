/**
 * 현재 DATABASE_URL 호스트만 출력 (비밀 미노출)
 * npx vercel env run --environment production -- npx tsx scripts/prod-db-host.ts
 */
import { loadDotenv } from "../src/lib/load-dotenv";

loadDotenv();

const url = process.env.DATABASE_URL?.trim() ?? "";
if (!url) {
  console.log(JSON.stringify({ host: null, error: "DATABASE_URL empty" }));
  process.exit(1);
}
try {
  console.log(JSON.stringify({ host: new URL(url).hostname }));
} catch {
  console.log(JSON.stringify({ host: null, error: "invalid DATABASE_URL" }));
  process.exit(1);
}
