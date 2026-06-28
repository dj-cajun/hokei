/**
 * 구글 로그인 설정 스모크 (값은 출력하지 않음)
 * npm run auth:check
 * npm run auth:check -- --production
 */
const production = process.argv.includes("--production");
const base = production
  ? "https://www.hokei.vn"
  : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

const GOOGLE_REDIRECT = `${base}/api/auth/google/redirect`;

async function fetchMeta(
  path: string,
  init?: RequestInit
): Promise<{ status: number; location?: string; bodyStart: string }> {
  const res = await fetch(`${base}${path}`, { redirect: "manual", ...init });
  const text = await res.text();
  return {
    status: res.status,
    location: res.headers.get("location") ?? undefined,
    bodyStart: text.slice(0, 120).replace(/\s+/g, " "),
  };
}

async function bundleHas(pattern: RegExp): Promise<boolean> {
  const home = await fetch(base);
  const html = await home.text();
  const paths = [...html.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]);
  const uniq = [...new Set(paths)];
  for (const p of uniq.slice(0, 100)) {
    const js = await fetch(`${base}${p}`);
    const text = await js.text();
    if (pattern.test(text)) return true;
  }
  return false;
}

function ok(msg: string) {
  console.log(`[auth:check] OK ${msg}`);
}
function fail(msg: string) {
  console.error(`[auth:check] FAIL ${msg}`);
}

async function main() {
  let failed = false;

  console.log(`[auth:check] base=${base}`);

  const googleRedirect = await fetchMeta("/api/auth/google/redirect", {
    method: "POST",
    body: new FormData(),
  });
  if (googleRedirect.status === 307 || googleRedirect.status === 302) {
    ok("Google redirect POST 라우트");
  } else if (googleRedirect.status === 400) {
    fail("Google redirect — NextAuth catch-all이 POST를 가로챔 (구배포)");
    failed = true;
  } else {
    fail(`Google redirect 비정상 status=${googleRedirect.status}`);
    failed = true;
  }

  const hasGoogle = await bundleHas(/apps\.googleusercontent\.com/);
  if (hasGoogle) ok("프론트 번들에 Google Client ID 포함");
  else {
    fail("NEXT_PUBLIC_GOOGLE_CLIENT_ID 미포함 — Vercel env 후 재배포");
    failed = true;
  }

  const hasKakaoJs = await bundleHas(/kakao\.min\.js|NEXT_PUBLIC_KAKAO_JS_KEY|KakaoLoginButton/);
  if (!hasKakaoJs) ok("프론트 번들에 카카오 로그인 코드 없음");
  else {
    fail("번들에 카카오 로그인 잔존 — 재배포 필요");
    failed = true;
  }

  console.log(`
[auth:check] 콘솔 Redirect URI 등록 확인:
  Google redirect: ${GOOGLE_REDIRECT}
  Google JS origins (OAuth 클라이언트): ${base} , http://localhost:3001
`);

  if (failed) process.exit(1);
  console.log("[auth:check] 자동 점검 통과 (실제 로그인은 브라우저에서 1회 확인 필요)");
}

main().catch((e) => {
  console.error("[auth:check]", e);
  process.exit(1);
});
