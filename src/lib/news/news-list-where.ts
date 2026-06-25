import type { Prisma } from "@/generated/prisma/client";
import { mergeVisiblePostWhere } from "@/lib/moderation";

const newsCategoryFilter: Prisma.CategoryWhereInput = {
  OR: [{ slug: "news" }, { parent: { slug: "news" } }],
};

const newsContentOr: Prisma.PostWhereInput[] = [
  {
    isAutomated: true,
    category: newsCategoryFilter,
  },
  {
    isAutomated: false,
    sourceUrl: { startsWith: "http" },
    category: newsCategoryFilter,
  },
];

/**
 * 뉴스 섹션 공개 글: 자동 수집 + 관리자 재가공(외부 URL 출처, isAutomated false)
 * 모더레이션·공개 상태(visiblePostWhere) 포함
 */
export const newsAutomatedWhere: Prisma.PostWhereInput = mergeVisiblePostWhere({
  OR: newsContentOr,
});
