#!/usr/bin/env node
/**
 * 2D SKETCH CAFE 데모 에셋 — PARTNER_ASSET_GUIDE 치수 검증 (로컬 public/)
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const root = join(import.meta.dirname, "..");
const partners = join(root, "public/partners");

function dims(file) {
  const out = execSync(`sips -g pixelWidth -g pixelHeight "${file}"`, {
    encoding: "utf8",
  });
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1] ?? 0);
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1] ?? 0);
  return { w, h };
}

const checks = [
  {
    file: "2d-sketch-cafe-event-banner.jpg",
    label: "LP 썸네일",
    ok: ({ w, h }) => w >= 600 && h >= 600,
  },
  {
    file: "2d-sketch-cafe-og.jpg",
    label: "OG",
    ok: ({ w, h }) => w === 1200 && h === 630,
  },
  {
    file: "2d-sketch-cafe-home-top-banner.jpg",
    label: "HOME_TOP PC",
    ok: ({ w, h }) => w >= 1200 && h >= 88 && h <= 160,
  },
  {
    file: "2d-sketch-cafe-home-top-banner-mobile.png",
    label: "HOME_TOP MO",
    ok: ({ w, h }) => w === 1024 && h === 220,
  },
];

let failed = false;
for (const c of checks) {
  const path = join(partners, c.file);
  if (!existsSync(path)) {
    console.error(`MISSING ${c.file} (${c.label})`);
    failed = true;
    continue;
  }
  const d = dims(path);
  const pass = c.ok(d);
  console.log(
    `${pass ? "OK" : "FAIL"} ${c.label} ${c.file} ${d.w}×${d.h}`
  );
  if (!pass) failed = true;
}

if (failed) process.exit(1);
