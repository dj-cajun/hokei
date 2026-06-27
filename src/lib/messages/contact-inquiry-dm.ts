import { hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { canonicalParticipantPair } from "@/lib/messages/conversation";
import { log } from "@/lib/logger";
import { notifyDirectMessage } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { ContactInquiryKind } from "@/lib/email/send-contact-email";

const SYSTEM_CONTACT_EMAIL = "contact-form@hokei.vn";
const SYSTEM_CONTACT_NAME = "사이트 문의";

export type ContactInquiryDmInput = {
  kind: ContactInquiryKind;
  name: string;
  email: string;
  subject: string;
  body: string;
};

function kindLabel(kind: ContactInquiryKind): string {
  return kind === "ads" ? "광고·제휴" : "일반";
}

export function formatContactInquiryMessage(input: ContactInquiryDmInput): string {
  const lines = [
    `[${kindLabel(input.kind)} 문의]`,
    `제목: ${input.subject.trim()}`,
    `이름: ${input.name.trim()}`,
    `회신: ${input.email.trim()}`,
    "",
    input.body.trim(),
  ];
  return lines.join("\n").slice(0, 2000);
}

async function ensureSystemContactUserId(): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { email: SYSTEM_CONTACT_EMAIL },
    select: { id: true },
  });
  if (existing) return existing.id;

  const password = await hash(randomUUID(), 12);
  const created = await prisma.user.create({
    data: {
      email: SYSTEM_CONTACT_EMAIL,
      name: SYSTEM_CONTACT_NAME,
      password,
      emailVerified: new Date(),
      role: "USER",
    },
    select: { id: true },
  });
  return created.id;
}

async function listAdminRecipientIds(): Promise<string[]> {
  const fromEnv = process.env.CONTACT_ADMIN_USER_ID?.trim();
  if (fromEnv) return [fromEnv];

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isSuspended: false },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return admins.map((a) => a.id);
}

async function getSystemContactSender(): Promise<{
  senderId: string;
  senderName: string;
}> {
  const senderId = await ensureSystemContactUserId();
  return { senderId, senderName: SYSTEM_CONTACT_NAME };
}

/** 문의 폼 → 관리자 쪽지함 (이메일과 병행) */
export async function deliverContactInquiryDm(
  input: ContactInquiryDmInput
): Promise<void> {
  const adminIds = await listAdminRecipientIds();
  if (adminIds.length === 0) {
    log("warn", "[contact-dm] 관리자 계정 없음");
    return;
  }

  const { senderId, senderName } = await getSystemContactSender();
  const messageBody = formatContactInquiryMessage(input);
  const preview = `${input.name.trim()}: [${kindLabel(input.kind)}] ${input.subject.trim()}`;

  for (const adminId of adminIds) {
    if (adminId === senderId) continue;

    try {
      const [participantAId, participantBId] = canonicalParticipantPair(
        senderId,
        adminId
      );

      let conversation = await prisma.conversation.findUnique({
        where: {
          participantAId_participantBId: { participantAId, participantBId },
        },
        select: { id: true },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { participantAId, participantBId },
          select: { id: true },
        });
      }

      await prisma.$transaction([
        prisma.directMessage.create({
          data: {
            conversationId: conversation.id,
            senderId,
            body: messageBody,
          },
        }),
        prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        }),
      ]);

      await notifyDirectMessage({
        recipientId: adminId,
        senderName: input.name.trim() || senderName,
        conversationId: conversation.id,
        preview,
      });
    } catch (err) {
      log("error", "[contact-dm] delivery failed", {
        adminId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
