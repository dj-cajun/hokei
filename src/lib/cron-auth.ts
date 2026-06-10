/** Vercel Cron / 수동 호출 인증 (CRON_SECRET) */

function normalizedCronSecret(): string | null {
  const raw = process.env.CRON_SECRET?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}

function bearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return null;
  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match?.[1]?.trim() ?? null;
}

export function isCronAuthorized(request: Request): boolean {
  const secret = normalizedCronSecret();
  if (!secret) return false;

  const token = bearerToken(request);
  if (token === secret) return true;

  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  if (headerSecret === secret) return true;

  return false;
}

export function cronAuthDebug(request: Request): {
  hasSecret: boolean;
  hasAuthHeader: boolean;
  hasCronSecretHeader: boolean;
  userAgent: string | null;
  vercelCronSchedule: string | null;
  isVercelCron: boolean;
} {
  const ua = request.headers.get("user-agent");
  return {
    hasSecret: Boolean(normalizedCronSecret()),
    hasAuthHeader: Boolean(request.headers.get("authorization")),
    hasCronSecretHeader: Boolean(request.headers.get("x-cron-secret")),
    userAgent: ua,
    vercelCronSchedule: request.headers.get("x-vercel-cron-schedule"),
    isVercelCron: Boolean(ua?.toLowerCase().includes("vercel-cron")),
  };
}
