import { readFileSync, existsSync } from "fs";
import { parse } from "dotenv";

function readSecret() {
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;
    const parsed = parse(readFileSync(path, "utf8"));
    const s = (parsed.CRON_SECRET ?? "").trim().replace(/^["']|["']$/g, "");
    if (s) return s;
  }
  throw new Error("CRON_SECRET 없음 (.env.local)");
}

const secret = readSecret();
const id = process.argv[2] ?? "cmqcnt4430000h4h7o4n0k0hn";
const url = `https://hokei-peach.vercel.app/api/health/${process.env.HEALTH_KIND ?? "post"}?id=${encodeURIComponent(id)}`;

const res = await fetch(url, { headers: { "x-cron-secret": secret } });
const text = await res.text();
console.log(res.status, text);
