import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { signInWithGoogleCredential } from "@/lib/auth/google-sign-in";

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "login");
  if (limited) return limited;

  try {
    const body = (await request.json()) as { credential?: string };
    if (!body.credential?.trim()) {
      return apiError("credential이 필요합니다.", 400);
    }

    await signInWithGoogleCredential(body.credential);
    return apiSuccess({});
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "구글 로그인 처리에 실패했습니다.";
    log("warn", "google credential sign-in failed", { error: message });
    return apiError(message, 401);
  }
}
