import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { reindexAllSearch } from "@/lib/search/index-post";

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return apiError("권한이 없습니다.", 401);
  }

  try {
    const result = await reindexAllSearch();
    return apiSuccess({ indexed: result.indexed });
  } catch (err) {
    log("error", "admin reindex-search failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("검색 인덱스 재구성에 실패했습니다.", 500);
  }
}
