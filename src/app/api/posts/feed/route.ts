import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { getPostsBySectionCursor } from "@/lib/posts";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section")?.trim();
  const cursor = searchParams.get("cursor");
  const communityOnly = searchParams.get("communityOnly") === "1";
  const limit = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(LIST_PAGE_SIZE), 10) || LIST_PAGE_SIZE)
  );

  if (!section) {
    return apiError("section 파라미터가 필요합니다.", 400);
  }

  const { items, nextCursor } = await getPostsBySectionCursor(
    section,
    limit,
    cursor,
    { communityOnly }
  );

  return apiSuccess({ items, nextCursor });
}
