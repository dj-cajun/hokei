import "server-only";

import { storeSlugForAgencyLoginId } from "@/lib/coupon/config";
import {
  couponOrderMessageMarker,
  formatCouponOrderSystemMessage,
} from "@/lib/coupon/order-conversation-format";
import { canonicalParticipantPair } from "@/lib/messages/conversation";
import { prisma } from "@/lib/prisma";

export type CouponOrderConversationInput = {
  orderId: string;
  buyerUserId: string;
  agencyLoginId: string;
  productName: string;
  amount: number;
  paymentMethod: string;
};

export async function findConversationIdForCouponOrder(
  orderId: string,
): Promise<string | null> {
  const marker = couponOrderMessageMarker(orderId);
  const message = await prisma.directMessage.findFirst({
    where: { body: { startsWith: marker } },
    select: { conversationId: true },
  });
  return message?.conversationId ?? null;
}

/** 결제 완료 시 구매자 ↔ 업소 사장 1:1 대화 + 시스템 안내 (멱등) */
export async function ensureCouponOrderConversation(
  input: CouponOrderConversationInput,
): Promise<{ conversationId: string; created: boolean } | null> {
  const existingId = await findConversationIdForCouponOrder(input.orderId);
  if (existingId) {
    return { conversationId: existingId, created: false };
  }

  const storeSlug = storeSlugForAgencyLoginId(input.agencyLoginId);
  if (!storeSlug) return null;

  const store = await prisma.partnerStore.findFirst({
    where: { slug: storeSlug, ownerId: { not: null } },
    select: { ownerId: true, name: true },
  });
  if (!store?.ownerId) return null;

  if (store.ownerId === input.buyerUserId) {
    return null;
  }

  const buyer = await prisma.user.findUnique({
    where: { id: input.buyerUserId },
    select: { id: true },
  });
  if (!buyer) return null;

  const [participantAId, participantBId] = canonicalParticipantPair(
    input.buyerUserId,
    store.ownerId,
  );

  const body = formatCouponOrderSystemMessage(input);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    let conversation = await tx.conversation.findUnique({
      where: {
        participantAId_participantBId: { participantAId, participantBId },
      },
    });

    const created = !conversation;
    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          participantAId,
          participantBId,
          contextCouponOrderId: input.orderId,
        },
      });
    } else {
      conversation = await tx.conversation.update({
        where: { id: conversation.id },
        data: { contextCouponOrderId: input.orderId },
      });
    }

    await tx.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: store.ownerId!,
        body,
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now },
    });

    return { conversationId: conversation.id, created };
  });

  return result;
}
