import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validation/profile";

export async function PATCH(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
        400
      );
    }

    const { name, avatarUrl } = parsed.data;
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        avatarUrl: avatarUrl?.trim() ? avatarUrl.trim() : null,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        email: true,
      },
    });

    return apiSuccess({ user, message: "프로필이 저장되었습니다." });
  } catch (err) {
    log("error", "profile update failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("프로필 저장에 실패했습니다.", 500);
  }
}

export async function DELETE(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (dbUser?.role === "ADMIN") {
      return apiError("관리자 계정은 탈퇴할 수 없습니다.", 403);
    }

    await prisma.user.delete({ where: { id: session.user.id } });
    return apiSuccess({ message: "회원 탈퇴가 완료되었습니다." });
  } catch (err) {
    log("error", "profile delete failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("탈퇴 처리에 실패했습니다.", 500);
  }
}
