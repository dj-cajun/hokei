import { HomePageContent } from "@/components/home/home-page-content";
import { HomeVideoHighlight } from "@/components/home/home-video-highlight";
import { log } from "@/lib/logger";

/** 홈 본문 실패 시에도 하이라이트 영상은 표시 */
export async function HomePageShell() {
  try {
    return <HomePageContent />;
  } catch (err) {
    log("error", "[home] HomePageContent failed", { err });
    return (
      <>
        <div className="block lg:hidden">
          <HomeVideoHighlight />
          <p className="bg-white px-4 py-6 text-center text-sm text-gray-500">
            일부 홈 콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
        <div className="hidden space-y-4 lg:block">
          <HomeVideoHighlight />
          <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-gray-500">
            일부 홈 콘텐츠를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        </div>
      </>
    );
  }
}
