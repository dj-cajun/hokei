import { hash } from "bcryptjs";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { issueEmailVerification } from "@/lib/auth/email-verification";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation/signup";

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "signup");
  if (limited) return limited;

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (existing) {
      if (!existing.emailVerified) {
        const mail = await issueEmailVerification(
          existing.id,
          existing.email,
          existing.name
        );
        return apiSuccess(
          {
            message: mail.emailSent
              ? "이미 가입된 이메일입니다. 인증 메일을 다시 보냈습니다. 메일함을 확인해 주세요."
              : "이미 가입된 이메일입니다. 인증 메일 발송에 실패했습니다. 잠시 후 재발송을 시도해 주세요.",
            email: existing.email,
            requiresVerification: true,
            emailSent: mail.emailSent,
            devLogged: mail.devLogged,
          },
          200
        );
      }
      return apiError("이미 사용 중인 이메일입니다.", 409);
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "USER",
        emailVerified: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const mail = await issueEmailVerification(user.id, user.email, user.name);

    return apiSuccess(
      {
        message: mail.emailSent
          ? "가입 신청이 완료되었습니다. 이메일의 인증 링크를 클릭한 뒤 로그인해 주세요."
          : "가입은 완료되었으나 인증 메일 발송에 실패했습니다. 인증 메일 재발송 페이지에서 다시 시도해 주세요.",
        user,
        requiresVerification: true,
        emailSent: mail.emailSent,
        devLogged: mail.devLogged,
      },
      201
    );
  } catch (err) {
    log("error", "signup failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("회원가입 처리 중 오류가 발생했습니다.", 500);
  }
}
