/**
 * Vercel 대시보드에 넣을 환경 변수 목록 (값은 직접 입력)
 * npm run vercel:env
 */

const required = [
  ["DATABASE_URL", "Neon/Supabase PostgreSQL URL (file: 금지)"],
  ["AUTH_SECRET", "openssl rand -base64 32 — 배포 후 변경 금지"],
  ["AUTH_URL", "https://www.hokei.vn (Auth.js canonical URL)"],
  ["CRON_SECRET", "openssl rand -base64 32"],
  ["NEXT_PUBLIC_SITE_URL", "https://www.hokei.vn"],
] as const;

const recommended = [
  ["GEMINI_API_KEY", "Vercel RSS 우회 수집 — VnExpress 등 영문 기사 번역 (필수)"],
  ["BLOB_READ_WRITE_TOKEN", "Vercel Storage → Blob (첨부 필수)"],
  ["UPSTASH_REDIS_REST_URL", "Upstash Redis (rate limit)"],
  ["UPSTASH_REDIS_REST_TOKEN", "Upstash Redis"],
  ["NEXT_PUBLIC_GOOGLE_CLIENT_ID", "Google OAuth (간편 로그인)"],
] as const;

const optional = [
  ["NEXT_PUBLIC_ADSENSE_CLIENT", "Google AdSense ca-pub-xxx"],
  ["NEXT_PUBLIC_ADSENSE_SLOT_HOME", "AdSense 홈 슬롯 ID"],
  ["NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE", "AdSense 글·가이드 상세 슬롯 ID"],
  ["NEXT_PUBLIC_ADSENSE_SLOT_FEED", "AdSense 목록 슬롯 (선택, 없으면 HOME)"],
  ["GOOGLE_SITE_VERIFICATION", "Search Console HTML 태그 content 값"],
  ["SENTRY_DSN", "Sentry DSN (javascript-nextjs)"],
  ["NEXT_PUBLIC_SENTRY_DSN", "Sentry 클라이언트 DSN (동일 URL)"],
  ["SENTRY_ORG", "nam-bac-technology-and-service"],
  ["SENTRY_PROJECT", "javascript-nextjs"],
  ["ZAI_API_KEY", "Z.AI 번역 (Gemini 대안)"],
  ["NAVER_CLIENT_ID", "로컬 전용 — Vercel 프로덕션 수집에 불필요"],
  ["NAVER_CLIENT_SECRET", "로컬 전용"],
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
  1) npm run db:pg:push           (최초 Neon 스키마)
  2) npm run search:pg:setup      (PostgreSQL 검색)
  3) Vercel Cron: CRON_SECRET + Authorization Bearer
  4) npm run news:check:prod      (수집·스키마 점검)
  5) npm run naver:test / gemini:test
`);
