import { z } from "zod";
import { auth } from "@/auth";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";

const updateSchema = z
  .object({
    role: z.enum(["USER", "ADMIN"]).optional(),
    writeBanned: z.boolean().optional(),
    isSuspended: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.role !== undefined ||
      data.writeBanned !== undefined ||
      data.isSuspended !== undefined,
    { message: "변경할 항목이 없습니다." }
  );

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
    return apiError("본인 계정은 이 화면에서 변경할 수 없습니다.", 400);
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        parsed.error.issues[0]?.message ?? "잘못된 요청입니다.",
        400
      );
    }

    const data: {
      role?: "USER" | "ADMIN";
      writeBanned?: boolean;
      isSuspended?: boolean;
    } = {};

    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.writeBanned !== undefined) {
      data.writeBanned = parsed.data.writeBanned;
    }
    if (parsed.data.isSuspended !== undefined) {
      data.isSuspended = parsed.data.isSuspended;
      if (parsed.data.isSuspended) {
        data.writeBanned = true;
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuspended: true,
        writeBanned: true,
        createdAt: true,
      },
    });

    const auditAction = parsed.data.isSuspended !== undefined
      ? parsed.data.isSuspended
        ? "USER_SUSPEND"
        : "USER_UNSUSPEND"
      : parsed.data.writeBanned !== undefined
        ? parsed.data.writeBanned
          ? "USER_WRITE_BAN"
          : "USER_WRITE_UNBAN"
        : "USER_ROLE_CHANGE";

    await writeAdminAudit({
      actorId: session.user.id,
      action: auditAction,
      targetType: "User",
      targetId: id,
      metadata: parsed.data,
      request,
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
  request: Request,
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
    await writeAdminAudit({
      actorId: session.user.id,
      action: "USER_DELETE",
      targetType: "User",
      targetId: id,
      request,
    });
    return apiSuccess({ deleted: true });
  } catch (err) {
    log("error", "admin user delete failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("사용자를 찾을 수 없습니다.", 404);
  }
}
