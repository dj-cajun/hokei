/** 뉴스 섹션 자동 수집 글 (서브카테고리·본문 news 포함) — Prisma/DB 의존 없음 */
export const newsAutomatedWhere = {
  status: "PUBLISHED" as const,
  isAutomated: true,
  category: {
    OR: [{ slug: "news" }, { parent: { slug: "news" } }],
  },
};
