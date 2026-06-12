import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { notifyDirectMessage } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

async function getConversationForUser(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;
  const userId = session.user.id;

  const conversation = await getConversationForUser(id, userId);
  if (!conversation) {
    return apiError("대화를 찾을 수 없습니다.", 404);
  }

  const messages = await prisma.directMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      senderId: true,
      readAt: true,
      createdAt: true,
    },
  });

  await prisma.directMessage.updateMany({
    where: {
      conversationId: id,
      senderId: { not: userId },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return apiSuccess({
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      isMine: m.senderId === userId,
      readAt: m.readAt?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "dmSend");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;
  const userId = session.user.id;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "메시지를 확인해 주세요.",
      400
    );
  }

  const conversation = await getConversationForUser(id, userId);
  if (!conversation) {
    return apiError("대화를 찾을 수 없습니다.", 404);
  }

  try {
    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.directMessage.create({
        data: {
          conversationId: id,
          senderId: userId,
          body: parsed.data.body,
        },
      });
      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() },
      });
      return created;
    });

    const recipientId =
      conversation.participantAId === userId
        ? conversation.participantBId
        : conversation.participantAId;

    void notifyDirectMessage({
      recipientId,
      senderName: session.user.name ?? "회원",
      conversationId: id,
      preview: parsed.data.body,
    });

    return apiSuccess({
      message: {
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        isMine: true,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (err) {
    log("error", "direct message send failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("쪽지 전송에 실패했습니다.", 500);
  }
}
