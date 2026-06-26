import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import {
  getHomeYouTubeHighlight,
  setHomeYouTubeUrl,
} from "@/lib/site-settings";

const bodySchema = z.object({
  url: z.string(),
});

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const highlight = await getHomeYouTubeHighlight();
  return apiSuccess({
    url: highlight.rawUrl ?? "",
    videoId: highlight.videoId,
    startSeconds: highlight.startSeconds,
    source: highlight.source,
  });
}

export async function PUT(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return apiError("요청 형식이 올바르지 않습니다.", 400);
    }

    const highlight = await setHomeYouTubeUrl(parsed.data.url);
    revalidatePath("/");

    return apiSuccess({
      url: highlight.rawUrl ?? "",
      videoId: highlight.videoId,
      startSeconds: highlight.startSeconds,
      source: highlight.source,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "설정 저장에 실패했습니다.";
    if (message.includes("YouTube")) {
      return apiError(message, 400);
    }
    log("error", "home youtube setting save failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("설정 저장에 실패했습니다.", 500);
  }
}
