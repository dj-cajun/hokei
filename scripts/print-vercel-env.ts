/**
 * Vercel 대시보드에 넣을 환경 변수 목록 (값은 직접 입력)
 * npm run vercel:env
 */

const required = [
  ["DATABASE_URL", "Neon/Supabase PostgreSQL URL (file: 금지)"],
  ["AUTH_SECRET", "openssl rand -base64 32"],
  ["CRON_SECRET", "openssl rand -base64 32"],
  ["NEXT_PUBLIC_SITE_URL", "https://your-domain.vercel.app"],
] as const;

const recommended = [
  ["NAVER_CLIENT_ID", "네이버 개발자센터"],
  ["NAVER_CLIENT_SECRET", "네이버 개발자센터 (검색 API 사용)"],
  ["BLOB_READ_WRITE_TOKEN", "Vercel Storage → Blob (첨부 필수)"],
  ["UPSTASH_REDIS_REST_URL", "Upstash Redis (rate limit)"],
  ["UPSTASH_REDIS_REST_TOKEN", "Upstash Redis"],
  ["NEXT_PUBLIC_GOOGLE_CLIENT_ID", "Google OAuth (간편 로그인)"],
] as const;

const optional = [
  ["NEXT_PUBLIC_ADSENSE_CLIENT", "Google AdSense ca-pub-xxx"],
  ["NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE", "AdSense 글 상세 슬롯 ID"],
  ["NEXT_PUBLIC_ADSENSE_SLOT_HOME", "AdSense 홈 슬롯 ID"],
  ["SENTRY_DSN", "Sentry DSN (javascript-nextjs)"],
  ["NEXT_PUBLIC_SENTRY_DSN", "Sentry 클라이언트 DSN (동일 URL)"],
  ["SENTRY_ORG", "nam-bac-technology-and-service"],
  ["SENTRY_PROJECT", "javascript-nextjs"],
  ["GEMINI_API_KEY", "VnExpress 번역"],
  ["ZAI_API_KEY", "Z.AI 번역"],
] as const;

console.log(`
=== Vercel Environment Variables ===

【필수】
${required.map(([k, d]) => `  ${k}\n    → ${d}`).join("\n")}

【권장】
${recommended.map(([k, d]) => `  ${k}\n    → ${d}`).join("\n")}

【선택】
${optional.map(([k]) => `  ${k}`).join("\n")}

배포 후:
  1) npx prisma migrate deploy  (DATABASE_URL=... 한 번 로컬에서)
  2) npm run search:pg:setup      (PostgreSQL 검색)
  3) Vercel Cron: CRON_SECRET + Authorization Bearer
  4) npm run naver:test           (키 확인)
`);
