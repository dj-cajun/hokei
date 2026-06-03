/**
 * 프로덕션 CSP — Next.js 런타임·Google GIS·Sentry·외부 이미지 허용
 * 개발 모드는 HMR 때문에 완화 정책 사용
 */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const connectSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://*.google.com",
    "https://*.sentry.io",
    "https://*.ingest.sentry.io",
    "https://vitals.vercel-insights.com",
    "https://*.vercel-scripts.com",
    "https://open.er-api.com",
  ];

  if (isDev) {
    connectSrc.push("http://localhost:*", "ws://localhost:*", "ws://127.0.0.1:*");
  }

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://accounts.google.com",
    "https://*.vercel-scripts.com",
  ];
  if (isDev) {
    scriptSrc.splice(2, 0, "'unsafe-eval'");
  }

  const styleSrc = [
    "'self'",
    "'unsafe-inline'",
    "https://accounts.google.com",
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    `style-src-elem ${styleSrc.join(" ")}`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://accounts.google.com",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-src https://accounts.google.com https://*.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
