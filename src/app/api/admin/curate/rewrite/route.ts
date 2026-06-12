import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { curateRewriteSchema } from "@/lib/admin/curate-schemas";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { rewriteForCuratedNews } from "@/lib/news/curate-rewrite";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

/** AI로 호치민 교민용 재가공 */
export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const json = await request.json();
    const parsed = curateRewriteSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const result = await rewriteForCuratedNews(parsed.data);
    return apiSuccess(result);
  } catch (err) {
    log("error", "curate rewrite failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    const message =
      err instanceof Error ? err.message : "재가공에 실패했습니다.";
    return apiError(message, 500);
  }
}
