import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { sendContactEmail } from "@/lib/email/send-contact-email";
import { deliverContactInquiryDm } from "@/lib/messages/contact-inquiry-dm";
import { log } from "@/lib/logger";
import { z } from "zod";

const bodySchema = z.object({
  kind: z.enum(["general", "ads"]),
  name: z.string().trim().min(1, "이름을 입력해 주세요.").max(80),
  email: z.string().email("올바른 이메일을 입력해 주세요."),
  subject: z.string().trim().min(1, "제목을 입력해 주세요.").max(120),
  body: z.string().trim().min(10, "내용을 10자 이상 입력해 주세요.").max(4000),
});

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "report");
  if (limited) return limited;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const { kind, name, email, subject, body } = parsed.data;
    const result = await sendContactEmail({
      kind,
      name,
      replyTo: email,
      subject,
      body,
    });

    if (!result.sent) {
      return apiError(
        "문의 전송에 실패했습니다. 잠시 후 다시 시도하거나 이메일로 직접 연락해 주세요.",
        503
      );
    }

    void deliverContactInquiryDm({
      kind,
      name,
      email,
      subject,
      body,
    }).catch((err) => {
      log("error", "contact dm failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return apiSuccess({
      message: "문의가 접수되었습니다. 평일 2~3영업일 내 답변드립니다.",
    });
  } catch (err) {
    log("error", "contact submit failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("문의 전송에 실패했습니다.", 500);
  }
}
