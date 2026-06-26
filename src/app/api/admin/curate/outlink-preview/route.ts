import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { curateOutlinkPreviewSchema } from "@/lib/admin/curate-schemas";
import { previewCurateOutlink } from "@/lib/admin/curate-outlink-metadata";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** URL만으로 아웃링크 카드 메타 추출 (본문 전문 X) */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { session, error } = await requireAdminApi();
  if (error) return error;

  try {
    const json = await request.json();
    const parsed = curateOutlinkPreviewSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const preview = await previewCurateOutlink(parsed.data);
    const category = await prisma.category.findFirst({
      where: { slug: preview.categorySlug, isActive: true },
      select: { id: true, label: true, slug: true },
    });

    return apiSuccess({
      ...preview,
      categoryId: category?.id ?? null,
      categoryLabel: category?.label ?? null,
      fetchedBy: session!.user.id,
    });
  } catch (err) {
    log("error", "curate outlink preview failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    const message =
      err instanceof Error ? err.message : "메타데이터 추출에 실패했습니다.";
    return apiError(message, 500);
  }
}
