import { apiSuccess } from "@/lib/api-response";
import { isDatabaseAvailable } from "@/lib/database-available";
import { log } from "@/lib/logger";
import { newsAutomatedWhere } from "@/lib/news-automated-where";
import { prisma } from "@/lib/prisma";
import { getGeneratedPrismaActiveProvider } from "@/lib/prisma-generated-provider";
import { PRISMA_DATASOURCE_PROVIDER } from "@/lib/prisma-datasource";

export const dynamic = "force-dynamic";

/** 프로덕션 DB 연결·뉴스 건수 진단 (비밀 노출 없음) */
export async function GET() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  let host = "";
  try {
    if (url.startsWith("http") || url.includes("://")) {
      host = new URL(url).hostname;
    }
  } catch {
    host = "invalid";
  }

  const base = {
    vercel: process.env.VERCEL === "1",
    databaseConfigured: isDatabaseAvailable(),
    dbHost: host || null,
    prismaMarker: PRISMA_DATASOURCE_PROVIDER,
    prismaClient: getGeneratedPrismaActiveProvider(),
  };

  if (!isDatabaseAvailable()) {
    return apiSuccess({
      ...base,
      ok: false,
      automatedNewsCount: 0,
      hint: "Vercel에 DATABASE_URL(PostgreSQL)이 Production·런타임에 설정됐는지 확인하세요.",
    });
  }

  try {
    const automatedNewsCount = await prisma.post.count({
      where: newsAutomatedWhere,
    });
    return apiSuccess({
      ...base,
      ok: true,
      automatedNewsCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("error", "health/db prisma failed", { message });
    return apiSuccess({
      ...base,
      ok: false,
      automatedNewsCount: 0,
      prismaError: message.slice(0, 200),
    });
  }
}
