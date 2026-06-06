import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const POLL_MS = 1_500;
const MAX_DURATION_MS = 55_000;

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  const { id } = await context.params;
  const userId = session.user.id;
  const sinceParam = new URL(request.url).searchParams.get("since");
  let cursor = sinceParam ? new Date(sinceParam) : new Date(0);
  if (Number.isNaN(cursor.getTime())) {
    cursor = new Date(0);
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    select: { id: true },
  });

  if (!conversation) {
    return apiError("대화를 찾을 수 없습니다.", 404);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      send({ type: "connected", at: new Date().toISOString() });

      const deadline = Date.now() + MAX_DURATION_MS;

      try {
        while (Date.now() < deadline) {
          const messages = await prisma.directMessage.findMany({
            where: {
              conversationId: id,
              createdAt: { gt: cursor },
            },
            orderBy: { createdAt: "asc" },
            take: 30,
            select: {
              id: true,
              body: true,
              senderId: true,
              createdAt: true,
            },
          });

          for (const m of messages) {
            cursor = m.createdAt;
            send({
              type: "message",
              message: {
                id: m.id,
                body: m.body,
                senderId: m.senderId,
                isMine: m.senderId === userId,
                createdAt: m.createdAt.toISOString(),
              },
            });
          }

          if (messages.some((m) => m.senderId !== userId)) {
            await prisma.directMessage.updateMany({
              where: {
                conversationId: id,
                senderId: { not: userId },
                readAt: null,
                createdAt: { lte: cursor },
              },
              data: { readAt: new Date() },
            });
          }

          await new Promise((r) => setTimeout(r, POLL_MS));
        }

        send({ type: "reconnect" });
      } catch {
        send({ type: "error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
