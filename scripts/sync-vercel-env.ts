/**
 * .env → Vercel Environment Variables (production + preview + development)
 * npx tsx scripts/sync-vercel-env.ts
 */
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
const SKIP = new Set(["DATABASE_URL"]); // SQLite는 Vercel에서 동작 안 함 — 대시보드에서 PG URL 수동 설정

function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
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

if (!existsSync(envPath)) {
  console.error("[sync-vercel-env] .env 없음");
  process.exit(1);
}

const vars = parseEnv(readFileSync(envPath, "utf8"));
const targets = (process.argv.includes("--all")
  ? ["production", "preview", "development"]
  : ["production"]) as readonly ("production" | "preview" | "development")[];

for (const [key, value] of Object.entries(vars)) {
  if (SKIP.has(key)) {
    console.warn(`[sync-vercel-env] skip ${key} (Vercel에서 PostgreSQL URL을 직접 설정하세요)`);
    continue;
  }
  if (!value) continue;

  for (const target of targets) {
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", key, target, "--force"],
      {
        input: value,
        encoding: "utf8",
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    if (r.status === 0) {
      console.log(`[sync-vercel-env] OK ${key} (${target})`);
    } else {
      const err = (r.stderr || r.stdout || "").slice(0, 120);
      console.warn(`[sync-vercel-env] ${key} (${target}): ${err.trim() || "failed"}`);
    }
  }
}

console.log("\n[sync-vercel-env] 완료 — DATABASE_URL은 Neon/Supabase URL을 Vercel에 수동 추가하세요.");
