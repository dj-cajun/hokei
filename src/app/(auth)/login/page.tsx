import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - 호케이 Hokei",
  description: "호케이 계정으로 로그인하세요.",
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <h1 className="text-xl font-bold text-foreground">로그인</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        호치민 교민 포털에 오신 것을 환영합니다
      </p>
      <div className="mt-6">
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-secondary" />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </div>
  );
}
