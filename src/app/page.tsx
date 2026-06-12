import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { HomePageContent } from "@/components/home/home-page-content";
import { FeedSkeleton } from "@/components/ui/skeleton";

export const revalidate = 60;

function HomeMainFallback() {
  return <FeedSkeleton rows={8} />;
}

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-background lg:bg-transparent">
        <Suspense fallback={<HomeMainFallback />}>
          <HomePageContent />
        </Suspense>
      </div>
    </div>
  );
}
