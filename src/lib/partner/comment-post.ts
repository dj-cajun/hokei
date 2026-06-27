import { getPromoPostsByStore } from "@/lib/promo/queries";

type StoreRef = { slug: string; name: string };

/**
 * LP 댓글 연결 게시글 검증.
 * null/빈 문자열은 연결 해제. 그 외에는 해당 업소 홍보 글 ID만 허용.
 */
export async function assertCommentPostIdForStore(
  store: StoreRef,
  commentPostId: string | null | undefined
): Promise<string | null | { error: string }> {
  const trimmed = commentPostId?.trim() ?? "";
  if (!trimmed) return null;

  const promo = await getPromoPostsByStore(store.slug, 200, store.name);
  if (!promo.items.some((item) => item.id === trimmed)) {
    return {
      error: "해당 업소의 홍보 글만 댓글 게시글로 연결할 수 있습니다.",
    };
  }

  return trimmed;
}
