import { revalidatePath } from "next/cache";

/** 게시글 생성·수정·삭제 후 공개 페이지 캐시 갱신 */
export function revalidatePostCaches(
  postId: string,
  options?: { sectionSlug?: string; categoryHref?: string }
) {
  revalidatePath(`/posts/${postId}`);
  revalidatePath("/");
  revalidatePath("/community");
  revalidatePath("/news");
  revalidatePath("/search");

  if (options?.sectionSlug) {
    revalidatePath(`/${options.sectionSlug}`);
  }
  if (options?.categoryHref) {
    revalidatePath(options.categoryHref);
  }
}
