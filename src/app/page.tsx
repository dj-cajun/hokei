import { Sidebar } from "@/components/layout/sidebar";
import { HomePageContent } from "@/components/home/home-page-content";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-[#f3f4f6] lg:bg-transparent">
        <HomePageContent />
      </div>
    </div>
  );
}
