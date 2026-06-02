import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  pattern: z.string().min(3).max(64),
  reason: z.string().min(1).max(200),
  expiresAt: z.string().datetime().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const entries = await prisma.ipBlockEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess({
    entries: entries.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      expiresAt: e.expiresAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력", 400);
  }

  const { pattern, reason, expiresAt } = parsed.data;

  const created = await prisma.ipBlockEntry.create({
    data: {
      pattern: pattern.trim(),
      reason,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: session!.user!.id,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "IP_BLOCK_CREATE",
    targetType: "IpBlockEntry",
    targetId: created.id,
    metadata: { pattern },
    request,
  });

  return apiSuccess({ entry: created }, 201);
}
