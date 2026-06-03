import { config } from "dotenv";
import { existsSync } from "fs";

/** `.env` → `.env.local` (local 우선). CI·프로덕션 CLI가 주입한 env는 `.env`로 덮지 않음 */
export function loadDotenv(): void {
  if (existsSync(".env")) config({ path: ".env", override: false });
  if (existsSync(".env.local")) config({ path: ".env.local", override: true });
}
