/**
 * .env 의 AUTH_SECRET 을 openssl 난수로 교체
 * Cursor 터미널: npm run env:auth-secret
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
  console.error(".env 파일이 없습니다. cp .env.example .env 후 다시 실행하세요.");
  process.exit(1);
}

if (!/^AUTH_SECRET=/m.test(content)) {
  content += `\nAUTH_SECRET="${secret}"\n`;
} else {
  content = content.replace(
    /^AUTH_SECRET=.*$/m,
    `AUTH_SECRET="${secret}"`
  );
}

writeFileSync(envPath, content, "utf8");
console.log("[env:auth-secret] AUTH_SECRET 이 교체되었습니다.");
console.log("[env:auth-secret] 개발 서버를 재시작하세요: npm run dev");
