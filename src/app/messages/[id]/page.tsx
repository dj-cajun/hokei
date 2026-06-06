import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { ConversationThread } from "@/components/messages/conversation-thread";
import { otherParticipantId } from "@/lib/messages/conversation";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "쪽지 - 호케이 Hokei",
};

export default async function ConversationPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/messages");
  }

  const { id } = await params;
  const userId = session.user.id;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [{ participantAId: userId }, { participantBId: userId }],
    },
    include: {
      participantA: { select: { id: true, name: true } },
      participantB: { select: { id: true, name: true } },
    },
  });

  if (!conversation) notFound();

  const peerId = otherParticipantId(conversation, userId);
  const peer =
    conversation.participantA.id === peerId
      ? conversation.participantA
      : conversation.participantB;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-2xl">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <Link href="/messages" className="text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-bold">{peer.name}</h1>
      </div>
      <ConversationThread conversationId={id} peerName={peer.name} />
    </div>
  );
}
