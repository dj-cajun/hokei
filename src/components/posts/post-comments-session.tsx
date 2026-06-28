"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { PostComments } from "@/components/posts/post-comments";
import { mapPostComments } from "@/lib/map-post-comments";

type CommentSource = Parameters<typeof mapPostComments>[0];

type PostCommentsSessionProps = {
  postId: string;
  comments: CommentSource;
  /** 업체 LP 등 — 바깥 섹션 제목과 중복 방지 */
  embedded?: boolean;
  premiumOwnerIds?: string[];
};

export function PostCommentsSession({
  postId,
  comments,
  embedded = false,
  premiumOwnerIds = [],
}: PostCommentsSessionProps) {
  const { data: session } = useSession();
  const sessionKey = session?.user?.id ?? "guest";
  const isAdmin = session?.user?.role === "ADMIN";
  const premiumOwnerIdSet = useMemo(
    () => new Set(premiumOwnerIds),
    [premiumOwnerIds]
  );

  const initialComments = useMemo(
    () =>
      mapPostComments(
        comments,
        session?.user?.id,
        isAdmin,
        premiumOwnerIdSet
      ),
    [comments, session?.user?.id, isAdmin, premiumOwnerIdSet]
  );

  return (
    <PostComments
      key={sessionKey}
      postId={postId}
      initialComments={initialComments}
      embedded={embedded}
    />
  );
}
