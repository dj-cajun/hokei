import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { curatePublishSchema } from "@/lib/admin/curate-schemas";
import { publishCuratedNews } from "@/lib/admin/publish-curated-news";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { log } from "@/lib/logger";
import { revalidatePostCaches } from "@/lib/revalidate-content";

export const dynamic = "force-dynamic";

/** 재가공 뉴스 게시 (출처 URL 필수, isAutomated=false) */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { session, error } = await requireAdminApi();
  if (error) return error;

  try {
    const json = await request.json();
    const parsed = curatePublishSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const { id } = await publishCuratedNews({
      ...parsed.data,
      authorId: session!.user.id,
    });

    revalidatePostCaches(id, { categoryHref: "/news" });

    await writeAdminAudit({
      actorId: session!.user.id,
      action: "NEWS_CURATE_PUBLISH",
      metadata: {
        postId: id,
        sourceUrl: parsed.data.sourceUrl,
        title: parsed.data.title.slice(0, 80),
      },
      request,
    });

    return apiSuccess({ id, message: "뉴스로 게시했습니다." }, 201);
  } catch (err) {
    log("error", "curate publish failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    const message = err instanceof Error ? err.message : "게시에 실패했습니다.";
    const status = message.includes("이미 등록된") ? 409 : 500;
    return apiError(message, status);
  }
}
