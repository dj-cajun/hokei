import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PartnerStoreOwnerForm } from "@/components/partner/partner-store-owner-form";
import { requireAuth } from "@/lib/auth-utils";

export const metadata: Metadata = {
  title: "제휴 업소 관리 - 호케이 Hokei",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPartnerPage() {
  const session = await requireAuth();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        회원 관리
      </Link>

      <div className="rounded-2xl bg-surface p-6 md:p-8">
        <h1 className="text-xl font-bold">제휴 업소 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.user.name}님 · 소개·연락처·썸네일을 직접 수정할 수 있습니다.
        </p>
        <PartnerStoreOwnerForm />
      </div>
    </div>
  );
}
