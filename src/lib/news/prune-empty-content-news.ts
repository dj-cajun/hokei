import { hasSubstantialNewsBody } from "@/lib/news/news-body-quality";
import { prisma } from "@/lib/prisma";
import { removePostFromSearch } from "@/lib/search/index-post";

/** 본문 없음(썸네일·제목만) 자동 뉴스 삭제 + 검색 인덱스 제거 */
export async function pruneEmptyContentAutomatedNews(): Promise<{
  checked: number;
  removed: number;
}> {
  const posts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: { id: true, title: true, content: true },
  });

  let removed = 0;
  for (const post of posts) {
    if (hasSubstantialNewsBody(post.content)) continue;
    await removePostFromSearch(post.id);
    await prisma.post.delete({ where: { id: post.id } });
    removed++;
  }

  return { checked: posts.length, removed };
}
