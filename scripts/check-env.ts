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

const content = readFileSync(envPath, "utf8");
const keys = parseKeys(content);
let failed = false;

for (const key of required) {
  if (!keys.has(key)) {
    console.error(`[env:check] 필수 누락: ${key}`);
    failed = true;
    continue;
  }
  const val = getValue(content, key);
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
  const val = getValue(content, key);
  if (!val || isPlaceholder(val)) {
    console.warn(`[env:check] 권장 미설정: ${key}`);
  } else {
    console.log(`[env:check] OK ${key}`);
  }
}

if (production) {
  const db = getValue(content, "DATABASE_URL")?.replace(/^["']|["']$/g, "") ?? "";
  if (db.startsWith("file:")) {
    console.error(
      "[env:check] 프로덕션: DATABASE_URL은 PostgreSQL이어야 합니다 (Neon/Supabase)"
    );
    failed = true;
  } else {
    console.log("[env:check] OK DATABASE_URL (PostgreSQL)");
  }

  const site =
    getValue(content, "NEXT_PUBLIC_SITE_URL")?.replace(/^["']|["']$/g, "") ?? "";
  if (!site.startsWith("https://") || /localhost|127\.0\.0\.1/i.test(site)) {
    console.error(
      "[env:check] 프로덕션: NEXT_PUBLIC_SITE_URL=https://실제도메인 필요"
    );
    failed = true;
  } else {
    console.log("[env:check] OK NEXT_PUBLIC_SITE_URL (https)");
  }

  const auth = getValue(content, "AUTH_SECRET")?.replace(/^["']|["']$/g, "") ?? "";
  if (auth.length < 32) {
    console.error("[env:check] 프로덕션: AUTH_SECRET 32자 이상 권장");
    failed = true;
  }

  if (!keys.has("BLOB_READ_WRITE_TOKEN")) {
    console.warn("[env:check] 프로덕션 권장: BLOB_READ_WRITE_TOKEN (Vercel Blob)");
  } else {
    const blob = getValue(content, "BLOB_READ_WRITE_TOKEN");
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
