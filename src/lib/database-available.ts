/** 빌드·런타임에서 Prisma DB 연결이 기대되는지 */
export function isDatabaseAvailable(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) return false;
  if (url.startsWith("file:") && process.env.VERCEL === "1") return false;
  return true;
}
