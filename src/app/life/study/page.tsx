import Link from "next/link";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { Sidebar } from "@/components/layout/sidebar";
import { LifeGuideStudyList } from "@/components/life/life-guide-study-list";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getStudyGuides } from "@/lib/life/guides";

export const metadata = {
  title: "교민 베트남어 공부 - 호케이",
  description: "카톡 단톡 매일 베트남어 학습 표현 아카이브",
};

export default async function LifeStudyPage() {
  const items = isDatabaseAvailable() ? await getStudyGuides(200) : [];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-border-light px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-bold">교민 베트남어 공부</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                매일 카톡에서 나온 표현을 차곡차곡 모았습니다
              </p>
            </div>
            <Link
              href="/life/write?domain=STUDY"
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              ✏️ 글쓰기
            </Link>
          </div>
        </header>
        <AdSenseUnit slotKind="feed" className="px-3" />
        <LifeGuideStudyList items={items} emptyMessage="아직 등록된 표현이 없습니다." />
        <div className="flex justify-center gap-4 border-t border-border-light px-3 py-3 text-center">
          <Link href="/life" className="text-xs text-primary hover:underline">
            생활 위키
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:underline">
            홈
          </Link>
        </div>
      </div>
    </div>
  );
}
