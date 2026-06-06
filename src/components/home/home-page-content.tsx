import { HomeCompactNewsList } from "@/components/home/home-compact-news-list";
import { HomeHeadlineSlider } from "@/components/home/home-headline-slider";
import { HomeMobileFeed } from "@/components/home/home-mobile-feed";
import { HomeVideoHighlight } from "@/components/home/home-video-highlight";
import {
  SafeBoardPreviewList,
  SafeWeatherQuickGrid,
} from "@/components/home/safe-home-sections";
import { FeedListClient } from "@/components/home/feed-list-client";
import { PopularPostsStrip } from "@/components/home/popular-posts-strip";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { isDatabaseAvailable } from "@/lib/database-available";
import { formatUnknownError, log } from "@/lib/logger";
import {
  getAutomatedNewsPosts,
  getCommunityNotices,
  getLatestCommunityPosts,
  getPopularUserPosts,
} from "@/lib/posts";
import type { FeedItem } from "@/types/feed";

const emptyFeed: FeedItem[] = [];

const homeFeedLoaders = [
  ["latest", () => getLatestCommunityPosts(12)],
  ["popular", () => getPopularUserPosts(12)],
  ["news", () => getAutomatedNewsPosts(10)],
  ["notices", () => getCommunityNotices(8)],
] as const;

async function loadHomeFeeds(): Promise<
  [FeedItem[], FeedItem[], FeedItem[], FeedItem[]]
> {
  if (!isDatabaseAvailable()) {
    return [emptyFeed, emptyFeed, emptyFeed, emptyFeed];
  }

  const results = await Promise.allSettled(
    homeFeedLoaders.map(([, load]) => load())
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    log(
      "error",
      `home feed ${homeFeedLoaders[index][0]} failed: ${formatUnknownError(result.reason)}`
    );
    return emptyFeed;
  }) as [FeedItem[], FeedItem[], FeedItem[], FeedItem[]];
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
        <HomeVideoHighlight />
        <PopularPostsStrip items={popular} />
        <AdSenseUnit slotKind="home" className="px-3" />
        <SafeBoardPreviewList />
        <HomeMobileFeed
          latest={latestItems}
          popular={popular.length > 0 ? popular : latestItems}
          notices={notices}
        />
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
            latest={news.length > 0 ? news : latestItems}
            popular={popular.length > 0 ? popular : latestItems}
            notices={notices}
          />
        </div>
        <SafeBoardPreviewList />
      </div>
    </>
  );
}
