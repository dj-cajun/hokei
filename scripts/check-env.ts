/**
 * 필수·권장 환경 변수 점검 (값은 출력하지 않음)
 * npm run env:check
 */
import { readFileSync, existsSync } from "fs";
import path from "path";

const production = process.argv.includes("--production");
const envPath = path.join(process.cwd(), ".env");

const required = ["DATABASE_URL", "AUTH_SECRET"] as const;
const recommended = [
  "CRON_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "NAVER_CLIENT_ID",
  "NAVER_CLIENT_SECRET",
] as const;

const optional = ["UPSTASH_REDIS_REST_URL", "SENTRY_DSN"] as const;

function parseKeys(content: string): Set<string> {
  const keys = new Set<string>();
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (m) keys.add(m[1]!);
  }
  return keys;
}

function isPlaceholder(value: string): boolean {
  const v = value.replace(/^["']|["']$/g, "").trim();
  return (
    !v ||
    /change-me|your-|example|placeholder/i.test(v) ||
    v === "your-secret-key-change-in-production" ||
    v === "your-random-cron-secret"
  );
}

function getValue(content: string, key: string): string | null {
  const m = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m?.[1]?.trim() ?? null;
}

if (!existsSync(envPath)) {
  console.error("[env:check] .env 없음 → cp .env.example .env");
  process.exit(1);
}

const localContent = readFileSync(envPath, "utf8");

// 프로덕션 점검은 .env.production.pg(있으면)를 우선 — 로컬 .env는 SQLite/localhost라 항상 실패
const prodEnvPath = path.join(process.cwd(), ".env.production.pg");
const hasProdEnv = production && existsSync(prodEnvPath);
const prodContent = hasProdEnv ? readFileSync(prodEnvPath, "utf8") : "";

/** 필수/권장: .env.production.pg에 있으면 그 값, 없으면 .env 폴백 */
function pickContent(key: string): string {
  if (hasProdEnv && new RegExp(`^${key}=`, "m").test(prodContent)) {
    return prodContent;
  }
  return localContent;
}

/**
 * 프로덕션 전용 값 — Vercel에서 관리하는 키는 로컬 .env(SQLite/localhost)로 폴백하지 않음.
 * .env.production.pg에 있으면 그 값, 없으면 "" (→ 점검 생략, Vercel 관리로 간주).
 */
function prodValue(key: string): string {
  if (hasProdEnv && new RegExp(`^${key}=`, "m").test(prodContent)) {
    return getValue(prodContent, key)?.replace(/^["']|["']$/g, "") ?? "";
  }
  return "";
}

/** 키가 .env.production.pg에 실제로 정의돼 있는지 (없으면 Vercel 관리로 간주) */
function inProdEnv(key: string): boolean {
  return hasProdEnv && new RegExp(`^${key}=`, "m").test(prodContent);
}

const content = localContent;
const keys = new Set([
  ...parseKeys(localContent),
  ...(hasProdEnv ? parseKeys(prodContent) : []),
]);
let failed = false;

if (hasProdEnv) {
  console.log("[env:check] 프로덕션 점검: .env.production.pg + .env 병합");
}

for (const key of required) {
  if (
    production &&
    !inProdEnv(key) &&
    (key === "AUTH_SECRET" || key === "CRON_SECRET")
  ) {
    console.log(
      `[env:check] ${key}은 Vercel 환경변수에서 관리 (로컬 점검 생략)`
    );
    continue;
  }
  if (!keys.has(key)) {
    console.error(`[env:check] 필수 누락: ${key}`);
    failed = true;
    continue;
  }
  const val = getValue(pickContent(key), key);
  if (!val || isPlaceholder(val)) {
    console.error(`[env:check] 필수 미설정/플레이스홀더: ${key}`);
    failed = true;
  } else {
    console.log(`[env:check] OK ${key}`);
  }
}

for (const key of recommended) {
  if (!keys.has(key)) {
    console.warn(`[env:check] 권장 누락: ${key}`);
    continue;
  }
  const val = getValue(pickContent(key), key);
  if (!val || isPlaceholder(val)) {
    console.warn(`[env:check] 권장 미설정: ${key}`);
  } else {
    console.log(`[env:check] OK ${key}`);
  }
}

if (production) {
  const db = getValue(pickContent("DATABASE_URL"), "DATABASE_URL")?.replace(/^["']|["']$/g, "") ?? "";
  if (db.startsWith("file:")) {
    console.error(
      "[env:check] 프로덕션: DATABASE_URL은 PostgreSQL이어야 합니다 (Neon/Supabase). .env.production.pg 확인"
    );
    failed = true;
  } else {
    console.log("[env:check] OK DATABASE_URL (PostgreSQL)");
  }

  const site = prodValue("NEXT_PUBLIC_SITE_URL");
  if (site && (!site.startsWith("https://") || /localhost|127\.0\.0\.1/i.test(site))) {
    console.error(
      "[env:check] 프로덕션: NEXT_PUBLIC_SITE_URL=https://실제도메인 필요"
    );
    failed = true;
  } else if (site) {
    console.log("[env:check] OK NEXT_PUBLIC_SITE_URL (https)");
  } else {
    console.log(
      "[env:check] NEXT_PUBLIC_SITE_URL은 Vercel 환경변수에서 관리 (로컬 점검 생략)"
    );
  }

  const auth = prodValue("AUTH_SECRET");
  if (auth && auth.length < 32) {
    console.error("[env:check] 프로덕션: AUTH_SECRET 32자 이상 권장");
    failed = true;
  }

  const authUrl = prodValue("AUTH_URL");
  const siteUrl = prodValue("NEXT_PUBLIC_SITE_URL");
  if (authUrl && siteUrl) {
    try {
      const authHost = new URL(authUrl).host;
      const siteHost = new URL(siteUrl).host;
      if (authHost !== siteHost) {
        console.error(
          "[env:check] 프로덕션: AUTH_URL과 NEXT_PUBLIC_SITE_URL 호스트가 다릅니다 (세션 쿠키 불안정)"
        );
        failed = true;
      } else {
        console.log("[env:check] OK AUTH_URL / NEXT_PUBLIC_SITE_URL 호스트 일치");
      }
    } catch {
      console.error("[env:check] 프로덕션: AUTH_URL 또는 NEXT_PUBLIC_SITE_URL URL 형식 오류");
      failed = true;
    }
  } else if (!authUrl && siteUrl) {
    console.warn(
      "[env:check] 프로덕션: AUTH_URL 미설정 — Vercel에 https://www.hokei.vn 설정 권장"
    );
  }

  const resend = getValue(pickContent("RESEND_API_KEY"), "RESEND_API_KEY")?.replace(/^["']|["']$/g, "") ?? "";
  const emailFrom = getValue(pickContent("EMAIL_FROM"), "EMAIL_FROM")?.replace(/^["']|["']$/g, "") ?? "";
  if (!resend || isPlaceholder(resend) || !emailFrom || isPlaceholder(emailFrom)) {
    console.warn(
      "[env:check] 프로덕션: RESEND_API_KEY·EMAIL_FROM 없으면 이메일 가입 불가 (Google 로그인만 가능)"
    );
  } else {
    console.log("[env:check] OK RESEND (이메일 가입)");
  }

  const naverId = prodValue("NAVER_CLIENT_ID");
  const naverSecret = prodValue("NAVER_CLIENT_SECRET");
  const naverOk =
    naverId.length >= 8 &&
    naverSecret.length >= 8 &&
    !isPlaceholder(naverId) &&
    !isPlaceholder(naverSecret);
  const gemini = prodValue("GEMINI_API_KEY");
  const zai = prodValue("ZAI_API_KEY");
  const translateOk =
    (gemini.length > 8 && !isPlaceholder(gemini)) ||
    (zai.length > 8 && !isPlaceholder(zai)) ||
    Boolean(prodValue("GOOGLE_TRANSLATE_API_KEY"));
  const cron = prodValue("CRON_SECRET");
  if (cron && !isPlaceholder(cron)) {
    console.log("[env:check] OK CRON_SECRET");
  } else if (inProdEnv("CRON_SECRET")) {
    console.error("[env:check] 프로덕션: CRON_SECRET 필수 (Vercel Cron 401 방지)");
    failed = true;
  } else {
    console.log("[env:check] CRON_SECRET은 Vercel 환경변수에서 관리 (로컬 점검 생략)");
  }

  const translateInProd =
    inProdEnv("GEMINI_API_KEY") ||
    inProdEnv("ZAI_API_KEY") ||
    inProdEnv("GOOGLE_TRANSLATE_API_KEY");
  if (translateOk) {
    if (!naverOk) {
      console.log(
        "[env:check] OK 뉴스 수집 — Vercel RSS 우회 모드 (네이버 API 불필요)"
      );
    }
  } else if (translateInProd) {
    console.error(
      "[env:check] 프로덕션 뉴스: GEMINI_API_KEY 또는 ZAI_API_KEY 필수 (Vercel RSS 우회+번역)"
    );
    failed = true;
  } else {
    console.log(
      "[env:check] GEMINI/ZAI 번역 키는 Vercel 환경변수에서 관리 (로컬 점검 생략)"
    );
  }
  if (!keys.has("BLOB_READ_WRITE_TOKEN")) {
    console.warn("[env:check] 프로덕션 권장: BLOB_READ_WRITE_TOKEN (Vercel Blob)");
  } else {
    const blob = prodValue("BLOB_READ_WRITE_TOKEN") || getValue(localContent, "BLOB_READ_WRITE_TOKEN");
    if (blob && !isPlaceholder(blob)) {
      console.log("[env:check] OK BLOB_READ_WRITE_TOKEN");
    } else {
      console.warn("[env:check] 프로덕션: BLOB_READ_WRITE_TOKEN 미설정 — 첨부 업로드 불가");
    }
  }
}

if (failed) {
  console.error("\n[env:check] 실패 — npm run env:auth-secret / env:cron-secret 참고");
  process.exit(1);
}

const naverId = getValue(content, "NAVER_CLIENT_ID")?.replace(/^["']|["']$/g, "") ?? "";
const naverSecret =
  getValue(content, "NAVER_CLIENT_SECRET")?.replace(/^["']|["']$/g, "") ?? "";
if (naverId && naverSecret) {
  if (naverId.length < 8 || naverSecret.length < 8) {
    console.warn(
      `[env:check] NAVER 키 길이 이상 — ID/Secret 각각 개발자센터에서 다시 복사 (docs/NAVER_API.md)`
    );
  } else {
    console.log("[env:check] OK NAVER 키 (설정됨, 동작은 npm run naver:test로 확인)");
  }
}

for (const key of optional) {
  if (keys.has(key)) {
    const val = getValue(content, key);
    if (val && !isPlaceholder(val)) {
      console.log(`[env:check] OK ${key} (선택)`);
    }
  }
}

if (keys.has("UPSTASH_REDIS_REST_URL") && keys.has("UPSTASH_REDIS_REST_TOKEN")) {
  const u = getValue(content, "UPSTASH_REDIS_REST_URL");
  const t = getValue(content, "UPSTASH_REDIS_REST_TOKEN");
  if (u && t && !isPlaceholder(u) && !isPlaceholder(t)) {
    console.log("[env:check] OK Upstash (분산 rate limit)");
  }
}

console.log("\n[env:check] 필수 항목 통과");
