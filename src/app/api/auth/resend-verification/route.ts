import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { resendVerificationEmail } from "@/lib/auth/email-verification";
import { log } from "@/lib/logger";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email("올바른 이메일을 입력해 주세요."),
});

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "signup");
  if (limited) return limited;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const result = await resendVerificationEmail(parsed.data.email);

    return apiSuccess({
      message:
        result.emailSent === false
          ? "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."
          : "등록된 미인증 계정이 있으면 인증 메일을 보냈습니다. 메일함을 확인해 주세요.",
      emailSent: result.emailSent ?? true,
      devLogged: result.devLogged,
    });
  } catch (err) {
    log("error", "resend verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("인증 메일 재발송에 실패했습니다.", 500);
  }
}
