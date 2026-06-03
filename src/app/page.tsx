import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { HomePageContent } from "@/components/home/home-page-content";

export const dynamic = "force-dynamic";

function HomeMainFallback() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center bg-[#f3f4f6] lg:bg-transparent">
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#0f172a]"
          aria-hidden
        />
        <p className="text-xs text-gray-400">불러오는 중…</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-[#f3f4f6] lg:bg-transparent">
        <Suspense fallback={<HomeMainFallback />}>
          <HomePageContent />
        </Suspense>
      </div>
    </div>
  );
}
