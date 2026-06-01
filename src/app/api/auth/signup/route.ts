import { hash } from "bcryptjs";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("이미 사용 중인 이메일입니다.", 409);
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return apiSuccess({ user }, 201);
  } catch (err) {
    log("error", "signup failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("회원가입 처리 중 오류가 발생했습니다.", 500);
  }
}
