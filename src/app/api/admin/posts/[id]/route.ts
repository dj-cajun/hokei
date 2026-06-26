import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { permanentlyDeletePost } from "@/lib/admin/permanently-delete-post";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

/** 게시글 영구 삭제 (뉴스·커뮤니티·큐레이션 공통) */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { session, error } = await requireAdminApi();
  if (error) return error;

  const { id } = await params;

  try {
    const result = await permanentlyDeletePost(id);

    await writeAdminAudit({
      actorId: session!.user.id,
      action: "POST_DELETE_PERMANENT",
      targetType: "Post",
      targetId: id,
      metadata: { title: result.title.slice(0, 80) },
      request,
    });

    return apiSuccess({ deleted: true, id: result.id });
  } catch (err) {
    log("error", "admin post delete failed", {
      id,
      error: err instanceof Error ? err.message : String(err),
    });
    const message =
      err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.";
    const status = message.includes("찾을 수 없") ? 404 : 500;
    return apiError(message, status);
  }
}
