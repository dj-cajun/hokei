import { SiteFooter } from "@/components/layout/site-footer";
import { HomeCompactNewsList } from "@/components/home/home-compact-news-list";
import { HomeHeadlineSlider } from "@/components/home/home-headline-slider";
import { HomeMobileFeed } from "@/components/home/home-mobile-feed";
import { HomeVideoHighlight } from "@/components/home/home-video-highlight";
import {
  SafeBoardPreviewList,
  SafeWeatherQuickGrid,
} from "@/components/home/safe-home-sections";
import { FeedListClient } from "@/components/home/feed-list-client";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { isDatabaseAvailable } from "@/lib/database-available";
import {
  getAutomatedNewsPosts,
  getCommunityNotices,
  getLatestCommunityPosts,
  getPopularCommunityPosts,
} from "@/lib/posts";
import type { FeedItem } from "@/types/feed";

const emptyFeed: FeedItem[] = [];

async function loadHomeFeeds(): Promise<
  [FeedItem[], FeedItem[], FeedItem[], FeedItem[]]
> {
  if (!isDatabaseAvailable()) {
    return [emptyFeed, emptyFeed, emptyFeed, emptyFeed];
  }
  try {
    return await Promise.all([
      getLatestCommunityPosts(12),
      getPopularCommunityPosts(12),
      getAutomatedNewsPosts(10),
      getCommunityNotices(8),
    ]);
  } catch {
    return [emptyFeed, emptyFeed, emptyFeed, emptyFeed];
  }
}

export async function HomePageContent() {
  const [latest, popular, news, notices] = await loadHomeFeeds();

  const latestItems = latest;
  const sliderSource = news.length > 0 ? news : latestItems;
  const compactNews = sliderSource.slice(0, 3);

  return (
    <>
      {/* 모바일 — 보스턴코리아형 밀도 */}
      <div className="block lg:hidden">
        <SafeWeatherQuickGrid />
        <HomeHeadlineSlider items={sliderSource} />
        <HomeCompactNewsList items={compactNews} />
        <SafeBoardPreviewList />
        <HomeMobileFeed
          latest={latestItems}
          popular={popular.length > 0 ? popular : latestItems}
          notices={notices}
        />
        <SiteFooter />
      </div>

      {/* 데스크톱 */}
      <div className="hidden space-y-4 lg:block">
        <WelcomeBanner />
        <HomeVideoHighlight />
        <div className="space-y-0">
          <div className="flex items-center border-b border-[#f3f4f6] bg-white px-2 py-1.5">
            <h2 className="border-l-4 border-l-red-500 pl-2 text-sm font-bold text-red-600">
              뉴스
            </h2>
          </div>
          <FeedListClient
            latest={latestItems}
            popular={popular.length > 0 ? popular : latestItems}
            notices={notices}
          />
        </div>
        <SafeBoardPreviewList />
      </div>
    </>
  );
}
