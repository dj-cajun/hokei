/**
 * 카카오·구글 로그인 설정 스모크 (값은 출력하지 않음)
 * npm run auth:check
 * npm run auth:check -- --production
 */
const production = process.argv.includes("--production");
const base = production
  ? "https://hokei-peach.vercel.app"
  : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3001";

const GOOGLE_REDIRECT = `${base}/api/auth/google/redirect`;
const KAKAO_CALLBACK = `${base}/api/auth/kakao/callback`;

async function fetchMeta(
  path: string,
  init?: RequestInit
): Promise<{ status: number; location?: string; contentType?: string; bodyStart: string }> {
  const res = await fetch(`${base}${path}`, { redirect: "manual", ...init });
  const text = await res.text();
  return {
    status: res.status,
    location: res.headers.get("location") ?? undefined,
    contentType: res.headers.get("content-type") ?? undefined,
    bodyStart: text.slice(0, 120).replace(/\s+/g, " "),
  };
}

async function bundleHas(pattern: RegExp): Promise<boolean> {
  const home = await fetch(base);
  const html = await home.text();
  const paths = [
    ...html.matchAll(/\/_next\/static\/[^"']+\.js/g),
  ].map((m) => m[0]);
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
function warn(msg: string) {
  console.warn(`[auth:check] WARN ${msg}`);
}
function fail(msg: string) {
  console.error(`[auth:check] FAIL ${msg}`);
}

async function main() {
let failed = false;

console.log(`[auth:check] base=${base}`);

const noCode = await fetchMeta("/api/auth/kakao/callback");
if (noCode.status === 307 && noCode.location?.includes("kakao_no_code")) {
  ok("카카오 callback 라우트 응답 (code 없음)");
} else {
  fail(`카카오 callback 비정상 status=${noCode.status}`);
  failed = true;
}

const withCode = await fetchMeta("/api/auth/kakao/callback?code=__smoke_invalid__");
if (
  withCode.status === 200 &&
  (/로그인 처리|kakao\/complete|잠시만|DOCTYPE html/.test(withCode.bodyStart))
) {
  ok("카카오 callback → HTML 브릿지 (최신 배포)");
} else if (
  withCode.status === 307 &&
  withCode.location?.includes("credentialssignin")
) {
  fail(
    "카카오 callback이 구버전(GET에서 바로 signIn)으로 동작 중 — main 재배포 필요 (d8fa8e1 이후)"
  );
  failed = true;
} else {
  warn(`카카오 callback code=test: status=${withCode.status} loc=${withCode.location ?? "-"}`);
}

const complete = await fetchMeta("/api/auth/kakao/complete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    code: "__smoke_invalid__",
    redirectUri: KAKAO_CALLBACK,
    callbackUrl: "/",
  }),
});
if (complete.status === 307) {
  ok("카카오 complete POST 라우트 (invalid code → redirect)");
} else if (complete.status === 400 && complete.bodyStart.includes("Bad request")) {
  fail("카카오 complete 라우트 미배포 — NextAuth catch-all이 POST를 가로챔");
  failed = true;
} else {
  warn(`카카오 complete: status=${complete.status}`);
}

const hasGoogle = await bundleHas(/apps\.googleusercontent\.com/);
const hasKakaoJs = await bundleHas(/kakao\.min\.js|NEXT_PUBLIC_KAKAO_JS_KEY/);
if (hasGoogle) ok("프론트 번들에 Google Client ID 포함");
else {
  fail("NEXT_PUBLIC_GOOGLE_CLIENT_ID 미포함 — Vercel env 후 재배포");
  failed = true;
}
if (hasKakaoJs) ok("프론트 번들에 Kakao JS Key 포함");
else {
  fail("NEXT_PUBLIC_KAKAO_JS_KEY 미포함");
  failed = true;
}

const kakaoOn = await bundleHas(
  /NEXT_PUBLIC_KAKAO_LOGIN_ENABLED|"true"===process\.env\.NEXT_PUBLIC_KAKAO_LOGIN_ENABLED|isKakaoLoginEnabled/
);
if (kakaoOn) ok("카카오 로그인 버튼 활성화 빌드 (ENABLED=true)");
else if (production) {
  fail("프로덕션: NEXT_PUBLIC_KAKAO_LOGIN_ENABLED=true 없음 — 버튼 비활성(준비 중)");
  failed = true;
} else {
  warn("로컬: NEXT_PUBLIC_KAKAO_LOGIN_ENABLED 미확인(번들 패턴)");
}

console.log(`
[auth:check] 콘솔 Redirect URI 등록 확인:
  Google redirect: ${GOOGLE_REDIRECT}
  Google JS origins (OAuth 클라이언트): ${base} , http://localhost:3001
  Kakao callback (REST·JS SDK 둘 다): ${KAKAO_CALLBACK}
  Kakao 웹 도메인 (JavaScript 키): ${base} , http://localhost:3001
  로컬 PC 로그인: /api/auth/kakao/start → REST API 키 Redirect URI 사용
`);

if (failed) process.exit(1);
console.log("[auth:check] 자동 점검 통과 (실제 로그인은 브라우저에서 1회 확인 필요)");
}

main().catch((e) => {
  console.error("[auth:check]", e);
  process.exit(1);
});
