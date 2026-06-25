import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { analyzeKakaoPaste, CurateAnalyzeUserError } from "@/lib/ai/curate-kakao";
import {
  KAKAO_RAW_MAX_LENGTH,
  KAKAO_RAW_MIN_LENGTH,
} from "@/lib/ai/curate-kakao-limits";
import { requireAdminApi } from "@/lib/admin/require-admin-api";

const bodySchema = z.object({
  rawText: z
    .string()
    .min(KAKAO_RAW_MIN_LENGTH, "분석할 텍스트가 너무 짧습니다.")
    .max(
      KAKAO_RAW_MAX_LENGTH,
      `텍스트가 너무 깁니다. 최대 ${KAKAO_RAW_MAX_LENGTH.toLocaleString("ko-KR")}자까지 붙여넣을 수 있습니다.`
    ),
});

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "입력값 오류", 400);
  }

  try {
    const result = await analyzeKakaoPaste(parsed.data.rawText);
    return apiSuccess(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI 분석 실패";
    if (process.env.NODE_ENV === "development") {
      console.error("[ai-curate/analyze]", message, err);
    }
    const status = err instanceof CurateAnalyzeUserError ? 400 : 502;
    return apiError(message, status);
  }
}
