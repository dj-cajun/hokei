import type { PartnerStore } from "@/generated/prisma/client";
import { getPostById } from "@/lib/posts";
import { getPromoPostsByStore } from "@/lib/promo/queries";

type CommentPostResult = {
  id: string;
  comments: NonNullable<Awaited<ReturnType<typeof getPostById>>>["comments"];
};

/** LP 하단 댓글 — commentPostId 우선, 없으면 홍보 글 첫 건 */
export async function resolveStoreCommentPost(
  store: Pick<PartnerStore, "slug" | "name" | "commentPostId">
): Promise<CommentPostResult | null> {
  if (store.commentPostId?.trim()) {
    const linked = await getPostById(store.commentPostId.trim());
    if (linked) {
      return { id: linked.id, comments: linked.comments ?? [] };
    }
  }

  const promo = await getPromoPostsByStore(store.slug, 1, store.name);
  const fallbackId = promo.items[0]?.id;
  if (!fallbackId) return null;

  const post = await getPostById(fallbackId);
  if (!post) return null;

  return { id: post.id, comments: post.comments ?? [] };
}
