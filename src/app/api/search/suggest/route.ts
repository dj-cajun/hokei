import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { suggestSearchTitles } from "@/lib/search/suggest";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return apiSuccess({ items: [] });
  }

  try {
    const items = await suggestSearchTitles(q, 8);
    return apiSuccess({
      items: items.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category.label,
      })),
    });
  } catch {
    return apiError("자동완성 조회에 실패했습니다.", 500);
  }
}
