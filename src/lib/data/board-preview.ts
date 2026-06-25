import type { BoardPreviewItem, BoardPreviewSection } from "@/types/feed";
import { isDatabaseAvailable } from "@/lib/database-available";
import { LIFE_INFO_HUB_HREF } from "@/lib/life-info-hub";
import {
  getCommunityCategoryBoardPreview,
  getLifeInfoBoardPreview,
} from "@/lib/posts";

type SectionMeta = {
  slug: string;
  title: string;
  href: string;
  writeSectionSlug?: string;
  accentClass: string;
  borderAccent: string;
  categorySlug?: string;
  emptyTitle: string;
};

const SECTION_META: SectionMeta[] = [
  {
    slug: "life-info",
    title: "찐 생활정보",
    href: LIFE_INFO_HUB_HREF,
    writeSectionSlug: "promo",
    accentClass: "text-rose-600",
    borderAccent: "border-l-rose-600",
    emptyTitle: "등록된 글이 없습니다",
  },
  {
    slug: "community-free",
    title: "교민 자유게시판",
    href: "/community/free-board",
    writeSectionSlug: "community",
    accentClass: "text-purple-600",
    borderAccent: "border-l-purple-600",
    categorySlug: "community-free-board",
    emptyTitle: "등록된 글이 없습니다",
  },
  {
    slug: "community-qa",
    title: "생존 Q&A (질문방)",
    href: "/community/survival-qa",
    writeSectionSlug: "community",
    accentClass: "text-violet-600",
    borderAccent: "border-l-violet-600",
    categorySlug: "community-survival-qa",
    emptyTitle: "등록된 글이 없습니다",
  },
];

function emptyItem(meta: SectionMeta): BoardPreviewItem {
  return {
    id: `${meta.slug}-empty`,
    title: meta.emptyTitle,
    href: meta.href,
    dateLabel: "—",
    isNew: false,
  };
}

async function loadSectionItems(meta: SectionMeta): Promise<BoardPreviewItem[]> {
  if (!isDatabaseAvailable()) return [emptyItem(meta)];

  const rows =
    meta.slug === "life-info"
      ? await getLifeInfoBoardPreview(4)
      : meta.categorySlug
        ? await getCommunityCategoryBoardPreview(meta.categorySlug, 4)
        : [];

  return rows.length > 0 ? rows : [emptyItem(meta)];
}

export async function getBoardPreviewSections(): Promise<BoardPreviewSection[]> {
  const sections = await Promise.all(
    SECTION_META.map(async (meta) => {
      const items = await loadSectionItems(meta);

      return {
        title: meta.title,
        href: meta.href,
        writeSectionSlug: meta.writeSectionSlug,
        accentClass: meta.accentClass,
        borderAccent: meta.borderAccent,
        items,
      };
    })
  );

  return sections;
}
