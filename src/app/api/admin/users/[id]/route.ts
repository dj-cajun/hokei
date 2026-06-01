import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return apiError("권한이 없습니다.", 403);
  }

  const { id } = await params;

  if (id === session.user.id) {
    return apiError("본인 계정의 권한은 변경할 수 없습니다.", 400);
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("잘못된 요청입니다.", 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return apiSuccess({ user });
  } catch (err) {
    log("error", "admin user patch failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("사용자를 찾을 수 없습니다.", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return apiError("권한이 없습니다.", 403);
  }

  const { id } = await params;

  if (id === session.user.id) {
    return apiError("본인 계정은 삭제할 수 없습니다.", 400);
  }

  try {
    await prisma.user.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    log("error", "admin user delete failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("사용자를 찾을 수 없습니다.", 404);
  }
}
