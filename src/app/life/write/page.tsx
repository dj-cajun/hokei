import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { LifeWriteForm } from "@/components/life/life-write-form";

export const metadata = {
  title: "생활 가이드 글쓰기 - 호케이",
};

export default async function LifeWritePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/life/write");
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-border-light px-3 py-3">
          <h1 className="text-base font-bold">생활 · 베트남어 글쓰기</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            현지에서 쓰는 표현과 꿀팁을 공유해 주세요
          </p>
        </header>
        <Suspense fallback={null}>
          <LifeWriteForm />
        </Suspense>
        <div className="border-t border-border-light px-3 py-3 text-center">
          <Link href="/life/study" className="text-xs text-primary hover:underline">
            베트남어 공부 목록
          </Link>
        </div>
      </div>
    </div>
  );
}
