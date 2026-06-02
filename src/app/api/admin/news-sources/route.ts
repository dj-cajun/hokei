import { z } from "zod";
import type { PostTopic } from "@/generated/prisma/client";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { syncNewsSourcesFromCode } from "@/lib/news/seed-sources-config";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  topic: z.enum(["KOREA", "TRAVEL", "VIETNAM_POLICY", "TOURIST"]),
  type: z.enum(["naver", "rss"]),
  query: z.string().max(200).optional(),
  url: z.string().url().max(500).optional(),
  sourceName: z.string().min(1).max(80),
  isEnabled: z.boolean().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const sources = await prisma.newsSourceConfig.findMany({
    orderBy: [{ topic: "asc" }, { sortOrder: "asc" }],
  });

  return apiSuccess({ sources });
}

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  if (searchParams.get("sync") === "code") {
    const added = await syncNewsSourcesFromCode();
    await writeAdminAudit({
      actorId: session!.user!.id,
      action: "NEWS_SOURCES_SYNC",
      metadata: { added },
      request,
    });
    return apiSuccess({ added });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  const { topic, type, query, url, sourceName, isEnabled } = parsed.data;
  if (type === "naver" && !query?.trim()) {
    return apiError("네이버 소스는 query가 필요합니다.", 400);
  }
  if (type === "rss" && !url?.trim()) {
    return apiError("RSS 소스는 url이 필요합니다.", 400);
  }

  const maxOrder = await prisma.newsSourceConfig.aggregate({
    where: { topic: topic as PostTopic },
    _max: { sortOrder: true },
  });

  const created = await prisma.newsSourceConfig.create({
    data: {
      topic: topic as PostTopic,
      type,
      query: type === "naver" ? query!.trim() : null,
      url: type === "rss" ? url!.trim() : null,
      sourceName,
      isEnabled: isEnabled ?? true,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "NEWS_SOURCE_CREATE",
    targetType: "NewsSourceConfig",
    targetId: created.id,
    request,
  });

  return apiSuccess({ source: created }, 201);
}
