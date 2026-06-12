import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { curateFetchSchema } from "@/lib/admin/curate-schemas";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { buildPostFromArticlePage } from "@/lib/news/ingest-article";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** 원문 URL에서 제목·본문·썸네일 초안 가져오기 */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { session, error } = await requireAdminApi();
  if (error) return error;

  try {
    const json = await request.json();
    const parsed = curateFetchSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const { sourceUrl, sourceName } = parsed.data;
    const draft = await buildPostFromArticlePage({
      topic: "KOREA",
      title: "",
      description: "",
      link: sourceUrl,
      sourceName: sourceName ?? "출처",
    });

    return apiSuccess({
      sourceUrl,
      sourceName: sourceName ?? null,
      title: draft.title,
      content: draft.content ?? "",
      thumbnail: draft.thumbnail || null,
      originalTitle: draft.title,
      fetchedBy: session!.user.id,
    });
  } catch (err) {
    log("error", "curate fetch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    const message =
      err instanceof Error ? err.message : "원문을 가져오지 못했습니다.";
    return apiError(message, 500);
  }
}
