import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { SEARCH_MIN_QUERY_LENGTH } from "@/lib/constants";
import { searchPostsPaginated } from "@/lib/posts";
import { parseSearchFilters } from "@/lib/search/filter-options";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const offset = Math.max(
    0,
    parseInt(searchParams.get("offset") ?? "0", 10) || 0
  );
  const limit = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
  );

  if (q.length < SEARCH_MIN_QUERY_LENGTH) {
    return apiSuccess({ items: [], nextOffset: null });
  }

  const filters = parseSearchFilters({
    section: searchParams.get("section") ?? undefined,
    period: searchParams.get("period") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    region: searchParams.get("region") ?? undefined,
  });

  try {
    const { items, nextOffset } = await searchPostsPaginated(
      q,
      limit,
      offset,
      filters
    );
    return apiSuccess({ items, nextOffset });
  } catch {
    return apiError("검색 결과 조회에 실패했습니다.", 500);
  }
}
