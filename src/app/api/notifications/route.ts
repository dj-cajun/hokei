import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      href: true,
      isRead: true,
      createdAt: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return apiSuccess({
    unreadCount,
    items: items.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError("요청 형식이 올바르지 않습니다.", 400);
  }

  const { ids, all } = parsed.data;

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });
    return apiSuccess({ ok: true });
  }

  if (!ids?.length) {
    return apiError("읽음 처리할 알림을 지정해 주세요.", 400);
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, id: { in: ids } },
    data: { isRead: true },
  });

  return apiSuccess({ ok: true });
}
