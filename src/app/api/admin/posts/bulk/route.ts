import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { permanentlyDeletePosts } from "@/lib/admin/permanently-delete-post";
import { buildAdminPostWhere } from "@/lib/admin/post-search-where";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import type { ModerationStatus } from "@/generated/prisma/client";

const querySchema = z.object({
  q: z.string().max(200).optional(),
  storeName: z.string().max(120).optional(),
  guestOnly: z.boolean().optional(),
  moderation: z.enum(["VISIBLE", "HIDDEN", "REMOVED", "ALL"]).optional(),
  section: z.string().max(80).optional(),
  categoryId: z.string().cuid().optional(),
  max: z.number().int().min(1).max(500).optional(),
});

const schema = z
  .object({
    ids: z.array(z.string().cuid()).max(100).optional(),
    query: querySchema.optional(),
    action: z.enum(["HIDE", "RESTORE", "REMOVE", "DELETE"]),
    note: z.string().max(500).optional(),
  })
  .refine((data) => (data.ids?.length ?? 0) > 0 || data.query, {
    message: "ids 또는 query가 필요합니다.",
  });

async function resolveBulkPostIds(
  ids: string[] | undefined,
  query: z.infer<typeof querySchema> | undefined
): Promise<string[]> {
  if (ids?.length) return [...new Set(ids)];

  const where = buildAdminPostWhere({
    q: query?.q,
    storeName: query?.storeName,
    guestOnly: query?.guestOnly,
    moderation: (query?.moderation ?? "ALL") as ModerationStatus | "ALL",
    sectionSlug: query?.section,
    categoryId: query?.categoryId,
  });
  const max = query?.max ?? 200;

  const rows = await prisma.post.findMany({
    where,
    take: max,
    orderBy: { publishedAt: "desc" },
    select: { id: true },
  });

  return rows.map((r) => r.id);
}

export async function PATCH(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 요청입니다.", 400);
  }

  const { action, note, query } = parsed.data;
  const targetIds = await resolveBulkPostIds(parsed.data.ids, query);

  if (targetIds.length === 0) {
    return apiSuccess({ updated: 0, deleted: 0, matched: 0 });
  }

  if (action === "DELETE") {
    const result = await permanentlyDeletePosts(targetIds);
    await writeAdminAudit({
      actorId: session!.user!.id,
      action: "POST_BULK_DELETE",
      metadata: {
        ids: targetIds.slice(0, 20),
        count: result.deleted,
        titles: result.titles.slice(0, 5),
        byQuery: Boolean(query),
      },
      request,
    });
    return apiSuccess({ deleted: result.deleted, matched: targetIds.length });
  }

  const statusMap = {
    HIDE: "HIDDEN",
    RESTORE: "VISIBLE",
    REMOVE: "REMOVED",
  } as const;

  const result = await prisma.post.updateMany({
    where: { id: { in: targetIds } },
    data: {
      moderationStatus: statusMap[action],
      moderatedAt: new Date(),
      moderatedById: session!.user!.id,
      moderationNote: note ?? null,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: `POST_BULK_${action}`,
    metadata: {
      ids: targetIds.slice(0, 20),
      count: result.count,
      byQuery: Boolean(query),
    },
    request,
  });

  return apiSuccess({ updated: result.count, matched: targetIds.length });
}
