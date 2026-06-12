import type { Prisma } from "@/generated/prisma/client";

const newsCategoryFilter: Prisma.CategoryWhereInput = {
  OR: [{ slug: "news" }, { parent: { slug: "news" } }],
};

/**
 * 뉴스 섹션 공개 글: 자동 수집 + 관리자 재가공(외부 URL 출처, isAutomated false)
 */
export const newsAutomatedWhere: Prisma.PostWhereInput = {
  status: "PUBLISHED",
  OR: [
    {
      isAutomated: true,
      category: newsCategoryFilter,
    },
    {
      isAutomated: false,
      sourceUrl: { startsWith: "http" },
      category: newsCategoryFilter,
    },
  ],
};
