import { PostCommentsSession } from "@/components/posts/post-comments-session";
import { mapPostComments } from "@/lib/map-post-comments";

type CommentSource = Parameters<typeof mapPostComments>[0];

type StoreCommentsSectionProps = {
  postId: string;
  comments: CommentSource;
};

export function StoreCommentsSection({
  postId,
  comments,
}: StoreCommentsSectionProps) {
  return (
    <section className="border-t border-border-light px-4 py-6">
      <h2 className="text-sm font-bold text-foreground">댓글</h2>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        방문 후기·질문을 남겨 주세요.
      </p>
      <div className="mt-4">
        <PostCommentsSession postId={postId} comments={comments} />
      </div>
    </section>
  );
}
