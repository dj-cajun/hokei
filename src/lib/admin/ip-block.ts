import { ipMatchesPattern } from "@/lib/admin/ip-block-patterns";
import { prisma } from "@/lib/prisma";

export { ipMatchesPattern };

export async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ip || ip === "unknown") return false;
  try {
    const now = new Date();
    const entries = await prisma.ipBlockEntry.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { pattern: true },
    });
    return entries.some((e) => ipMatchesPattern(ip, e.pattern));
  } catch {
    // 마이그레이션 미적용 DB에서도 로그인·API가 500으로 죽지 않도록 fail-open
    return false;
  }
}
