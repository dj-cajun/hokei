/**
 * Google OAuth 연결 점검 (키 값은 출력하지 않음)
 * npx tsx scripts/verify-oauth-providers.ts [--production]
 */
import { readFileSync, existsSync } from "fs";
import path from "path";

const production = process.argv.includes("--production");
const base = production
  ? "https://hokei-peach.vercel.app"
  : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

function loadEnv(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env");
  if (!existsSync(envPath)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2]!.trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]!] = v;
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const googleClient = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();

  console.log(`[oauth] base=${base}`);

  if (googleClient) {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=invalid.smoke.token`
    );
    if (res.status === 400) {
      console.log("[oauth] OK Google tokeninfo 엔드포인트 접근 가능");
    } else {
      console.warn(`[oauth] WARN Google tokeninfo status=${res.status}`);
    }
  } else {
    console.warn("[oauth] WARN .env에 NEXT_PUBLIC_GOOGLE_CLIENT_ID 없음");
  }

  const g = await fetch(`${base}/api/auth/google/redirect`, {
    method: "POST",
    body: new FormData(),
    redirect: "manual",
  });

  if (g.status === 307 || g.status === 302) {
    console.log("[oauth] OK Google redirect 라우트 배포됨");
  } else if (g.status === 400) {
    console.error("[oauth] FAIL Google redirect — NextAuth만 응답 (구배포)");
    process.exit(1);
  } else {
    console.warn(`[oauth] WARN Google redirect status=${g.status}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
