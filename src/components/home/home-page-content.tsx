import { HomeCompactNewsList } from "@/components/home/home-compact-news-list";
import { HomeNewsLoadAlert } from "@/components/home/home-news-load-alert";
import { HomeHeadlineSlider } from "@/components/home/home-headline-slider";
import { HomeMobileFeed } from "@/components/home/home-mobile-feed";
import { HomeVideoHighlight } from "@/components/home/home-video-highlight";
import {
  SafeBoardPreviewList,
  SafeWeatherQuickGrid,
} from "@/components/home/safe-home-sections";
import { FeedListClient } from "@/components/home/feed-list-client";
import { PopularPostsStrip } from "@/components/home/popular-posts-strip";
import { HomePartnerBanner } from "@/components/partner/home-partner-banner";
import { AdSenseUnit } from "@/components/ads/adsense-unit";
import { WelcomeBanner } from "@/components/home/welcome-banner";
import { HomeLifeStrip } from "@/components/home/home-life-strip";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getFeaturedLifeGuide } from "@/lib/life/guides";
import { formatUnknownError, log } from "@/lib/logger";
import { getHomeYouTubeHighlight } from "@/lib/site-settings";
import {
  getAutomatedNewsPosts,
  getCommunityNotices,
  getLatestCommunityPosts,
  getPopularUserPosts,
} from "@/lib/posts";
import type { FeedItem } from "@/types/feed";

const emptyFeed: FeedItem[] = [];

async function safeLoad<T>(name: string, load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch (reason) {
    log("error", `home ${name} failed: ${formatUnknownError(reason)}`);
    return fallback;
  }
}

/** Neon 깨우기 — 첫 조회 실패 시 1회 재시도 */
async function loadHomeNews(): Promise<FeedItem[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await getAutomatedNewsPosts(12);
    } catch (reason) {
      log("error", `home news failed (attempt ${attempt + 1}): ${formatUnknownError(reason)}`);
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 2500));
        continue;
      }
    }
    break;
  }
  return emptyFeed;
}

export async function HomePageContent() {
  if (!isDatabaseAvailable()) {
    return (
      <p className="px-3 py-8 text-center text-sm text-muted-foreground">
        DATABASE_URL을 설정하면 뉴스·게시판을 불러옵니다.
      </p>
    );
  }

  // 1) 뉴스·v2 생활 — 우선 로드 (뉴스가 홈에서 가장 먼저 보이도록)
  const [news, featuredLife] = await Promise.all([
    loadHomeNews(),
    safeLoad("featuredLife", () => getFeaturedLifeGuide(), null),
  ]);

  // 2) 커뮤니티 피드 — 뉴스 다음
  const [latest, popular, notices, homeYoutube] = await Promise.all([
    safeLoad("latest", () => getLatestCommunityPosts(12), emptyFeed),
    safeLoad("popular", () => getPopularUserPosts(12), emptyFeed),
    safeLoad("notices", () => getCommunityNotices(8), emptyFeed),
    safeLoad("homeYoutube", () => getHomeYouTubeHighlight(), {
      videoId: "d-fY16xMeT4",
      startSeconds: 12,
      source: "default" as const,
    }),
  ]);

  const latestItems = latest;
  const sliderSource = news.length > 0 ? news : latestItems;
  const compactNews = news.slice(0, 3);

  return (
    <>
      {news.length === 0 ? <HomeNewsLoadAlert /> : null}
      {/* 모바일 — 뉴스 우선 */}
      <div className="block lg:hidden">
        <SafeWeatherQuickGrid />
        <HomeHeadlineSlider items={sliderSource} />
        <HomeCompactNewsList items={compactNews} />
        <HomeLifeStrip featuredLife={featuredLife} />
        <HomeVideoHighlight
          videoId={homeYoutube.videoId}
          startSeconds={homeYoutube.startSeconds}
        />
        <PopularPostsStrip items={popular} />
        <HomePartnerBanner />
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
        <div className="space-y-0">
          <div className="flex items-center border-b border-[#f3f4f6] bg-surface px-2 py-1.5">
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
        <HomeLifeStrip featuredLife={featuredLife} />
        <HomeVideoHighlight
          videoId={homeYoutube.videoId}
          startSeconds={homeYoutube.startSeconds}
        />
        <HomePartnerBanner className="hidden lg:block" />
        <SafeBoardPreviewList />
      </div>
    </>
  );
}
