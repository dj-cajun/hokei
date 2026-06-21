"use client";

import { NewsThumbnail } from "@/components/news/thumbnail";
import { PostActionBar } from "@/components/posts/post-action-bar";
import { PostSourceAttribution } from "@/components/posts/post-source-attribution";
import type { PostTopic } from "@/lib/post-topic";

type NewsPostClientBlocksProps = {
  postId: string;
  title: string;
  likeCount: number;
  thumbnail?: string | null;
  sourceUrl: string;
  sourceName?: string | null;
  topic: PostTopic;
  showThumbnail: boolean;
};

/** 썸네일·액션바만 — 댓글·광고는 본문 아래(page.tsx) */
export function NewsPostClientBlocks({
  postId,
  title,
  likeCount,
  thumbnail,
  sourceUrl,
  sourceName,
  topic,
  showThumbnail,
}: NewsPostClientBlocksProps) {
  return (
    <>
      {showThumbnail && (
        <div className="relative mt-2 aspect-[16/9] w-full overflow-hidden rounded-sm bg-secondary">
          <NewsThumbnail
            src={thumbnail}
            sourceUrl={sourceUrl}
            topic={topic}
            className="aspect-[16/9] w-full rounded-sm object-cover"
          />
        </div>
      )}

      <PostSourceAttribution
        sourceName={sourceName}
        sourceUrl={sourceUrl}
      />

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <PostActionBar postId={postId} title={title} likeCount={likeCount} />
      </div>
    </>
  );
}
