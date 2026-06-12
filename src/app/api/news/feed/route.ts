import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { getNewsArchivePostsCursor } from "@/lib/news-archive";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    30,
    Math.max(
      1,
      parseInt(searchParams.get("limit") ?? String(LIST_PAGE_SIZE), 10) ||
        LIST_PAGE_SIZE
    )
  );

  try {
    const { items, nextCursor } = await getNewsArchivePostsCursor(
      limit,
      cursor
    );
    return apiSuccess({ items, nextCursor });
  } catch {
    return apiError("뉴스 목록 조회에 실패했습니다.", 500);
  }
}
