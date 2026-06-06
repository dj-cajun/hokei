function isPlaceholderDatabaseUrl(url: string): boolean {
  return /example\.com|placeholder|change-me|your-secret/i.test(url);
}

/** 빌드·런타임에서 Prisma DB 연결이 기대되는지 */
export function isDatabaseAvailable(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url || isPlaceholderDatabaseUrl(url)) return false;
  const onCi = process.env.CI === "true" || process.env.CI === "1";
  if (url.startsWith("file:") && process.env.VERCEL === "1" && !onCi) {
    return false;
  }
  return (
    url.startsWith("postgresql://") ||
    url.startsWith("postgres://") ||
    url.startsWith("file:")
  );
}
