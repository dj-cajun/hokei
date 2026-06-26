import { prisma } from "@/lib/prisma";
import { removePostFromSearch } from "@/lib/search/index-post";
import { revalidatePostCaches } from "@/lib/revalidate-content";
import { deleteUploadFile } from "@/lib/upload";

export type PermanentlyDeletePostResult = {
  id: string;
  title: string;
  sectionSlug?: string;
  categoryHref: string;
};

/** 관리자 영구 삭제 — 첨부·검색 인덱스·DB 레코드 제거 */
export async function permanentlyDeletePost(
  postId: string
): Promise<PermanentlyDeletePostResult> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      attachments: { select: { url: true } },
      category: {
        select: { href: true, parent: { select: { slug: true } } },
      },
    },
  });

  if (!post) {
    throw new Error("게시글을 찾을 수 없습니다.");
  }

  for (const att of post.attachments) {
    await deleteUploadFile(att.url);
  }

  await prisma.post.delete({ where: { id: postId } });
  await removePostFromSearch(postId);

  revalidatePostCaches(postId, {
    sectionSlug: post.category.parent?.slug,
    categoryHref: post.category.href,
  });

  return {
    id: post.id,
    title: post.title,
    sectionSlug: post.category.parent?.slug,
    categoryHref: post.category.href,
  };
}

export async function permanentlyDeletePosts(
  postIds: string[]
): Promise<{ deleted: number; titles: string[] }> {
  const uniqueIds = [...new Set(postIds)];
  const titles: string[] = [];
  let deleted = 0;

  for (const id of uniqueIds) {
    const result = await permanentlyDeletePost(id);
    titles.push(result.title);
    deleted += 1;
  }

  return { deleted, titles };
}
