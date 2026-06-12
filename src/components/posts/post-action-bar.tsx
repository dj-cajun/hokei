import { PostLikeButton } from "@/components/posts/post-like-button";
import { BookmarkButton } from "@/components/posts/bookmark-button";
import { ShareButton } from "@/components/posts/share-button";

type PostActionBarProps = {
  postId: string;
  title: string;
  likeCount: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
};

export function PostActionBar({
  postId,
  title,
  likeCount,
  likedByMe = false,
  bookmarkedByMe = false,
}: PostActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <PostLikeButton
        postId={postId}
        initialCount={likeCount}
        initialLiked={likedByMe}
      />
      <BookmarkButton postId={postId} initialBookmarked={bookmarkedByMe} />
      <ShareButton title={title} />
    </div>
  );
}
