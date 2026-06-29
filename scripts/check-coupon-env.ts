#!/usr/bin/env tsx
/**
 * 호케이 쿠폰 연동 env 점검 (로컬·프로덕션 준비)
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(name: string) {
  const p = resolve(process.cwd(), name);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const errors: string[] = [];
  const warnings: string[] = [];
  const production = process.env.NODE_ENV === "production";

  const apiUrl = process.env.NEXT_PUBLIC_COUPON_API_URL?.trim();
  const slugs = process.env.NEXT_PUBLIC_COUPON_ENABLED_SLUGS?.trim();
  const secret = process.env.COUPON_INTERNAL_SECRET?.trim();

  if (!apiUrl) {
    if (production) errors.push("NEXT_PUBLIC_COUPON_API_URL required");
    else warnings.push("NEXT_PUBLIC_COUPON_API_URL unset — default localhost:3020");
  }

  if (!slugs) {
    warnings.push("NEXT_PUBLIC_COUPON_ENABLED_SLUGS unset — default 2d-sketch-cafe");
  }

  if (!secret) {
    errors.push("COUPON_INTERNAL_SECRET required (must match coupon API)");
  } else if (secret === "dev-coupon-internal-secret" && production) {
    errors.push("COUPON_INTERNAL_SECRET must not be dev default in production");
  }

  if (apiUrl?.includes("localhost") && production) {
    errors.push("NEXT_PUBLIC_COUPON_API_URL must not be localhost in production");
  }

  const { COUPON_ENABLED_SLUGS, agencyLoginIdForStore } = await import(
    "../src/lib/coupon/config"
  );

  for (const slug of COUPON_ENABLED_SLUGS) {
    if (!agencyLoginIdForStore(slug)) {
      errors.push(
        `NEXT_PUBLIC_COUPON_ENABLED_SLUGS: "${slug}" has no agency mapping (config.ts or COUPON_STORE_MAP)`,
      );
    }
  }

  for (const w of warnings) console.warn(`⚠ ${w}`);
  for (const e of errors) console.error(`✗ ${e}`);

  if (errors.length === 0) {
    console.log("✓ Hokei coupon env OK");
    process.exit(0);
  }

  process.exit(1);
}

main();
