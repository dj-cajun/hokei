import type { PostTopic } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { newsAutomatedWhere } from "@/lib/news-automated-where";
import type { NewsBoardSlug } from "@/lib/news-boards-config";

export type { NewsBoardConfig, NewsBoardSlug } from "@/lib/news-boards-config";
export {
  getNewsBoardConfig,
  isNewsSectionPath,
  NEWS_BOARD_ITEMS,
} from "@/lib/news-boards-config";

const LOCAL_TOPICS: PostTopic[] = ["VIETNAM_POLICY", "TRAVEL", "TOURIST"];

/** 서버 전용 — Prisma where 조건 */
export function getNewsBoardWhere(
  slug: NewsBoardSlug
): Prisma.PostWhereInput {
  const base = { ...newsAutomatedWhere };

  switch (slug) {
    case "news-local":
      return {
        ...base,
        topic: { in: LOCAL_TOPICS },
      };
    case "news-world":
      return {
        ...base,
        topic: "KOREA",
      };
    case "news-community":
      return {
        ...base,
        OR: [
          { category: { slug: "news-column-opinion" } },
          {
            OR: [
              { title: { contains: "교민" } },
              { title: { contains: "단톡" } },
              { title: { contains: "카톡" } },
              { title: { contains: "커뮤니티" } },
              { summary: { contains: "교민" } },
            ],
          },
        ],
      };
    default:
      return base;
  }
}
