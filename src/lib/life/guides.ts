import type { LifeDomain, LifeGuideKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugifyLifeTitle } from "@/lib/life/slugify-title";

export { slugifyLifeTitle };

export type LifeGuideListItem = {
  id: string;
  slug: string;
  kind: LifeGuideKind;
  domain: LifeDomain;
  title: string;
  vnText: string | null;
  sourceLabel: string | null;
  isCrawl: boolean;
};

const listSelect = {
  id: true,
  slug: true,
  kind: true,
  domain: true,
  title: true,
  vnText: true,
  sourceLabel: true,
  isCrawl: true,
} satisfies Prisma.LifeGuideSelect;

export async function getLifeGuides(options?: {
  domain?: LifeDomain;
  kind?: LifeGuideKind;
  excludeStudy?: boolean;
  limit?: number;
}): Promise<LifeGuideListItem[]> {
  return prisma.lifeGuide.findMany({
    where: {
      ...(options?.domain ? { domain: options.domain } : {}),
      ...(options?.kind ? { kind: options.kind } : {}),
      ...(options?.excludeStudy && !options?.domain
        ? { domain: { not: "STUDY" } }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    take: options?.limit ?? 100,
    select: listSelect,
  });
}

export async function getStudyGuides(limit = 100): Promise<LifeGuideListItem[]> {
  return getLifeGuides({ domain: "STUDY", limit });
}

export async function getLifeGuideBySlug(slug: string) {
  return prisma.lifeGuide.findUnique({ where: { slug } });
}

export async function getFeaturedStudyGuide(): Promise<LifeGuideListItem | null> {
  const rows = await prisma.lifeGuide.findMany({
    where: { domain: "STUDY", kind: "PHRASE" },
    orderBy: { publishedAt: "desc" },
    take: 1,
    select: listSelect,
  });
  return rows[0] ?? null;
}

export async function getFeaturedLifeGuide(): Promise<LifeGuideListItem | null> {
  const study = await getFeaturedStudyGuide();
  if (study) return study;

  const rows = await prisma.lifeGuide.findMany({
    where: { kind: "PHRASE", domain: { not: "STUDY" } },
    orderBy: { publishedAt: "desc" },
    take: 1,
    select: listSelect,
  });
  return rows[0] ?? null;
}
