"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { PostComments } from "@/components/posts/post-comments";
import { mapPostComments } from "@/lib/map-post-comments";

type CommentSource = Parameters<typeof mapPostComments>[0];

type PostCommentsSessionProps = {
  postId: string;
  comments: CommentSource;
};

export function PostCommentsSession({
  postId,
  comments,
}: PostCommentsSessionProps) {
  const { data: session } = useSession();
  const sessionKey = session?.user?.id ?? "guest";
  const isAdmin = session?.user?.role === "ADMIN";

  const initialComments = useMemo(
    () => mapPostComments(comments, session?.user?.id, isAdmin),
    [comments, session?.user?.id, isAdmin]
  );

  return (
    <PostComments
      key={sessionKey}
      postId={postId}
      initialComments={initialComments}
    />
  );
}
