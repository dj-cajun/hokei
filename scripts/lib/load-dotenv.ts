import { config } from "dotenv";
import { existsSync } from "fs";

/** Next.js와 동일: `.env` → `.env.local` (local 우선). 파일이 셸 env보다 우선 */
export function loadDotenv(): void {
  if (existsSync(".env")) config({ path: ".env", override: true });
  if (existsSync(".env.local")) config({ path: ".env.local", override: true });
}
