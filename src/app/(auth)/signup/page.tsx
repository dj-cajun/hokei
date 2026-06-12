import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "회원가입 - 호케이 Hokei",
  description: "호치민 한국 교민 커뮤니티 호케이에 무료로 가입하세요.",
  robots: { index: true, follow: true },
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-sm md:p-8">
      <h1 className="text-xl font-bold text-foreground">회원가입</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        가입 후 이메일 인증을 완료하면 로그인할 수 있습니다
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-secondary" />}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  );
}
