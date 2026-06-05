import { Suspense } from "react";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이메일 인증 - 호케이 Hokei",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-xl font-bold text-foreground">이메일 인증</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        메일함에서 인증 링크를 확인해 주세요
      </p>
      <div className="mt-6">
        <Suspense
          fallback={<div className="h-40 animate-pulse rounded-xl bg-secondary" />}
        >
          <VerifyEmailPanel />
        </Suspense>
      </div>
    </div>
  );
}
