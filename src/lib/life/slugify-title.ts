/** 클라이언트·서버 공용 — prisma 등 서버 전용 모듈과 분리 */
export function slugifyLifeTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/\[매일\s*베트남어\]/gi, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  const suffix = Date.now().toString(36).slice(-5);
  return base ? `${base}-${suffix}` : `study-${suffix}`;
}
