/**
 * OAuth 제공자 연결 점검 (키 값은 출력하지 않음)
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
  const kakaoRest = env.KAKAO_REST_API_KEY?.trim();
  const googleClient = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const kakaoRedirect = `${base}/api/auth/kakao/callback`;

  console.log(`[oauth] base=${base}`);

  if (kakaoRest) {
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: kakaoRest,
        redirect_uri: kakaoRedirect,
        code: "__invalid_smoke_code__",
      }),
    });
    const tokenText = await tokenRes.text();
    let err = "";
    try {
      const j = JSON.parse(tokenText) as { error?: string; error_description?: string };
      err = j.error_description || j.error || "";
    } catch {
      err = tokenText.slice(0, 80);
    }
    if (tokenRes.status === 400 && /authorization code not found|invalid_grant/i.test(err)) {
      console.log("[oauth] OK 카카오 REST 키·Redirect URI 조합 (카카오 서버가 code만 거부)");
    } else if (/invalid_client|KOE010/i.test(err)) {
      console.error("[oauth] FAIL 카카오 REST 키 또는 앱 설정 오류");
      process.exit(1);
    } else if (/redirect_uri|KOE320/i.test(err)) {
      console.error(
        `[oauth] FAIL 카카오 Redirect URI 미등록: ${kakaoRedirect}`
      );
      process.exit(1);
    } else {
      console.warn(`[oauth] WARN 카카오 토큰 응답 status=${tokenRes.status} err=${err.slice(0, 100)}`);
    }
  } else {
    console.warn("[oauth] WARN .env에 KAKAO_REST_API_KEY 없음 (로컬 파일만 검사)");
  }

  if (googleClient) {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=invalid.smoke.token`
    );
    if (res.status === 400) {
      console.log("[oauth] OK Google tokeninfo 엔드포인트 접근 가능");
    } else {
      console.warn(`[oauth] WARN Google tokeninfo status=${res.status}`);
    }
  }

  const routes = await Promise.all([
    fetch(`${base}/api/auth/google/redirect`, { method: "POST", redirect: "manual" }),
    fetch(`${base}/api/auth/kakao/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "x",
        redirectUri: kakaoRedirect,
      }),
      redirect: "manual",
    }),
    fetch(`${base}/api/auth/kakao/callback?code=x`, { redirect: "manual" }),
  ]);

  const [g, c, cb] = routes;
  if (g.status === 307 || g.status === 302) {
    console.log("[oauth] OK Google redirect 라우트 배포됨");
  } else if (g.status === 400) {
    console.error("[oauth] FAIL Google redirect — NextAuth만 응답 (구배포)");
  } else {
    console.warn(`[oauth] WARN Google redirect status=${g.status}`);
  }

  if (c.status === 307 || c.status === 302) {
    console.log("[oauth] OK Kakao complete 라우트 배포됨");
  } else if (c.status === 400) {
    console.error("[oauth] FAIL Kakao complete — NextAuth만 응답 (구배포)");
  }

  if (cb.status === 200) {
    const t = await cb.text();
    if (/로그인 처리/.test(t)) {
      console.log("[oauth] OK Kakao callback HTML 브릿지");
    }
  } else if (cb.status === 307) {
    const loc = cb.headers.get("location") ?? "";
    if (loc.includes("credentialssignin")) {
      console.error("[oauth] FAIL Kakao callback 구버전 (GET signIn)");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
