import type { BoardPreviewItem, BoardPreviewSection } from "@/types/feed";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getSectionBoardPreview } from "@/lib/posts";

type SectionMeta = {
  slug: string;
  title: string;
  href: string;
  accentClass: string;
  borderAccent: string;
  tabs?: { id: string; label: string }[];
  communityOnly?: boolean;
  emptyTitle: string;
  emptyHref: string;
};

const SECTION_META: SectionMeta[] = [
  {
    slug: "community",
    title: "커뮤니티",
    href: "/community",
    accentClass: "text-purple-600",
    borderAccent: "border-l-purple-600",
    tabs: [
      { id: "all", label: "전체" },
      { id: "free", label: "자유" },
      { id: "qa", label: "Q&A" },
    ],
    communityOnly: true,
    emptyTitle: "등록된 글이 없습니다",
    emptyHref: "/community",
  },
  {
    slug: "jobs",
    title: "구인구직",
    href: "/jobs",
    accentClass: "text-blue-600",
    borderAccent: "border-l-blue-600",
    tabs: [
      { id: "all", label: "전체" },
      { id: "hire", label: "구인" },
      { id: "seek", label: "구직" },
    ],
    emptyTitle: "등록된 글이 없습니다",
    emptyHref: "/jobs",
  },
  {
    slug: "real-estate",
    title: "부동산",
    href: "/real-estate",
    accentClass: "text-emerald-600",
    borderAccent: "border-l-emerald-600",
    tabs: [
      { id: "all", label: "전체" },
      { id: "rent", label: "임대" },
      { id: "sale", label: "매매" },
    ],
    emptyTitle: "등록된 글이 없습니다",
    emptyHref: "/real-estate",
  },
  {
    slug: "classifieds",
    title: "중고장터",
    href: "/classifieds",
    accentClass: "text-orange-600",
    borderAccent: "border-l-orange-500",
    tabs: [
      { id: "all", label: "전체" },
      { id: "sell", label: "팝니다" },
      { id: "buy", label: "삽니다" },
    ],
    emptyTitle: "등록된 글이 없습니다",
    emptyHref: "/classifieds",
  },
];

function emptyItem(meta: SectionMeta): BoardPreviewItem {
  return {
    id: `${meta.slug}-empty`,
    title: meta.emptyTitle,
    href: meta.emptyHref,
    dateLabel: "—",
    isNew: false,
  };
}

export async function getBoardPreviewSections(): Promise<BoardPreviewSection[]> {
  const sections = await Promise.all(
    SECTION_META.map(async (meta) => {
      const rows = isDatabaseAvailable()
        ? await getSectionBoardPreview(meta.slug, 4, {
            communityOnly: meta.communityOnly,
          })
        : [];

      return {
        title: meta.title,
        href: meta.href,
        accentClass: meta.accentClass,
        borderAccent: meta.borderAccent,
        tabs: meta.tabs,
        items: rows.length > 0 ? rows : [emptyItem(meta)],
      };
    })
  );

  return sections;
}
