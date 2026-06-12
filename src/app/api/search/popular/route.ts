import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { getPopularSearchQueries } from "@/lib/search/popular-searches";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  try {
    const items = await getPopularSearchQueries(10);
    return apiSuccess({ items });
  } catch {
    return apiError("인기 검색어 조회에 실패했습니다.", 500);
  }
}
