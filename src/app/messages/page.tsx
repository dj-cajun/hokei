import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/auth";
import { MessagesInbox } from "@/components/messages/messages-inbox";

export const metadata: Metadata = {
  title: "쪽지함 - 호케이 Hokei",
};

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/messages");
  }

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 px-4 py-4 lg:max-w-2xl">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/profile" className="text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">쪽지함</h1>
      </div>
      <MessagesInbox />
    </div>
  );
}
