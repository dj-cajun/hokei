import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import {
  canonicalParticipantPair,
  otherParticipantId,
} from "@/lib/messages/conversation";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  recipientId: z.string().min(1),
  postId: z.string().optional(),
  message: z.string().trim().min(1).max(2000).optional(),
});

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: {
      participantA: { select: { id: true, name: true } },
      participantB: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, senderId: true, createdAt: true, readAt: true },
      },
    },
  });

  const unreadCounts = await prisma.directMessage.groupBy({
    by: ["conversationId"],
    where: {
      conversation: {
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { id: true },
  });
  const unreadMap = new Map(
    unreadCounts.map((r) => [r.conversationId, r._count.id])
  );

  return apiSuccess({
    conversations: conversations.map((c) => {
      const peerId = otherParticipantId(c, userId);
      const peer =
        c.participantA.id === peerId ? c.participantA : c.participantB;
      const last = c.messages[0];
      return {
        id: c.id,
        peer: { id: peer.id, name: peer.name },
        contextPostId: c.contextPostId,
        lastMessage: last
          ? {
              body: last.body.slice(0, 120),
              senderId: last.senderId,
              createdAt: last.createdAt.toISOString(),
              isMine: last.senderId === userId,
            }
          : null,
        unreadCount: unreadMap.get(c.id) ?? 0,
        lastMessageAt: c.lastMessageAt.toISOString(),
      };
    }),
  });
}

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "dmCreate");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const { recipientId, postId, message } = parsed.data;
  const userId = session.user.id;

  if (recipientId === userId) {
    return apiError("자기 자신에게는 쪽지를 보낼 수 없습니다.", 400);
  }

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });
  if (!recipient) {
    return apiError("수신자를 찾을 수 없습니다.", 404);
  }

  const [participantAId, participantBId] = canonicalParticipantPair(
    userId,
    recipientId
  );

  try {
    let conversation = await prisma.conversation.findUnique({
      where: {
        participantAId_participantBId: { participantAId, participantBId },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participantAId,
          participantBId,
          contextPostId: postId ?? null,
        },
      });
    } else if (postId && !conversation.contextPostId) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { contextPostId: postId },
      });
    }

    if (message) {
      await prisma.$transaction([
        prisma.directMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            body: message,
          },
        }),
        prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        }),
      ]);
    }

    return apiSuccess({ conversationId: conversation.id });
  } catch (err) {
    log("error", "conversation create failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("쪽지 대화를 시작하지 못했습니다.", 500);
  }
}
