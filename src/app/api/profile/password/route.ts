import { compare, hash } from "bcryptjs";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { isOAuthOnlyUser } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { profilePasswordSchema } from "@/lib/validation/profile";

export async function PATCH(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  try {
    const body = await request.json();
    const parsed = profilePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, kakaoId: true },
    });

    if (!user) {
      return apiError("사용자를 찾을 수 없습니다.", 404);
    }

    if (isOAuthOnlyUser(user)) {
      return apiError(
        "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.",
        400
      );
    }

    const valid = await compare(parsed.data.currentPassword, user.password);
    if (!valid) {
      return apiError("현재 비밀번호가 올바르지 않습니다.", 400);
    }

    const hashed = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return apiSuccess({ message: "비밀번호가 변경되었습니다." });
  } catch (err) {
    log("error", "password change failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("비밀번호 변경에 실패했습니다.", 500);
  }
}
