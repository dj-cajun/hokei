/**
 * .env 에 CRON_SECRET 추가·교체 (openssl)
 * npm run env:cron-secret
 */
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");
const secret = execSync("openssl rand -base64 32", { encoding: "utf8" }).trim();

let content: string;
try {
  content = readFileSync(envPath, "utf8");
} catch {
  console.error(".env 파일이 없습니다.");
  process.exit(1);
}

if (!/^CRON_SECRET=/m.test(content)) {
  const block = content.endsWith("\n") ? "" : "\n";
  content += `${block}\n# Vercel Cron / 수동 뉴스 수집 API\nCRON_SECRET="${secret}"\n`;
} else {
  content = content.replace(/^CRON_SECRET=.*$/m, `CRON_SECRET="${secret}"`);
}

writeFileSync(envPath, content, "utf8");
console.log("[env:cron-secret] CRON_SECRET 설정 완료");
