import { FeedListClient } from "@/components/home/feed-list-client";
import { getAutomatedNewsPosts, getLatestPosts, getPopularPosts } from "@/lib/posts";
import { noticeItems } from "@/lib/data/feed";

export async function FeedList() {
  const [latest, popular, news] = await Promise.all([
    getLatestPosts(12),
    getPopularPosts(12),
    getAutomatedNewsPosts(10),
  ]);

  const latestItems = latest.length > 0 ? latest : news;

  return (
    <div className="space-y-0">
      <div className="flex items-center border-b border-[#f3f4f6] bg-white px-2 py-1.5">
        <h2 className="border-l-4 border-l-red-500 pl-2 text-sm font-bold text-red-600">
          뉴스
        </h2>
      </div>
      <FeedListClient
        latest={latestItems}
        popular={popular.length > 0 ? popular : latestItems}
        notices={noticeItems}
      />
    </div>
  );
}
