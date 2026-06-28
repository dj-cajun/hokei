import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** LifeGuide 영구 삭제 (베트남어 공부·생활 위키) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  const guide = await prisma.lifeGuide.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, domain: true },
  });

  if (!guide) {
    return apiError("생활 가이드를 찾을 수 없습니다.", 404);
  }

  try {
    await prisma.lifeGuide.delete({ where: { id } });

    await writeAdminAudit({
      actorId: session!.user!.id,
      action: "LIFE_GUIDE_DELETE",
      targetType: "LifeGuide",
      targetId: id,
      metadata: {
        title: guide.title.slice(0, 80),
        slug: guide.slug,
        domain: guide.domain,
      },
      request,
    });

    return apiSuccess({ deleted: true, id });
  } catch (err) {
    log("error", "admin life guide delete failed", {
      id,
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("삭제 중 오류가 발생했습니다.", 500);
  }
}
