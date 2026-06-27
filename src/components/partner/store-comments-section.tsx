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
      <PostCommentsSession
        postId={postId}
        comments={comments}
        embedded
      />
    </section>
  );
}
