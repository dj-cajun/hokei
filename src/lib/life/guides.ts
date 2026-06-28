import type { LifeDomain, LifeGuideKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugifyLifeTitle } from "@/lib/life/slugify-title";
import { log } from "@/lib/logger";

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

async function safeLifeQuery<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    log("error", `life guides ${label} failed`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

export async function getLifeGuides(options?: {
  domain?: LifeDomain;
  kind?: LifeGuideKind;
  excludeStudy?: boolean;
  limit?: number;
}): Promise<LifeGuideListItem[]> {
  return safeLifeQuery("getLifeGuides", () =>
    prisma.lifeGuide.findMany({
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
    }),
    []
  );
}

export async function getStudyGuides(limit = 100): Promise<LifeGuideListItem[]> {
  return getLifeGuides({ domain: "STUDY", limit });
}

export async function getLifeGuideBySlug(slug: string) {
  return safeLifeQuery(
    "getLifeGuideBySlug",
    () => prisma.lifeGuide.findUnique({ where: { slug } }),
    null
  );
}

export async function listLifeGuidesForSitemap(limit = 500) {
  return safeLifeQuery(
    "listLifeGuidesForSitemap",
    () =>
      prisma.lifeGuide.findMany({
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: { slug: true, updatedAt: true },
      }),
    []
  );
}

export async function getFeaturedStudyGuide(): Promise<LifeGuideListItem | null> {
  const rows = await safeLifeQuery(
    "getFeaturedStudyGuide",
    () =>
      prisma.lifeGuide.findMany({
        where: { domain: "STUDY", kind: "PHRASE" },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: listSelect,
      }),
    []
  );
  return rows[0] ?? null;
}

export async function getFeaturedLifeGuide(): Promise<LifeGuideListItem | null> {
  const study = await getFeaturedStudyGuide();
  if (study) return study;

  const rows = await safeLifeQuery(
    "getFeaturedLifeGuide",
    () =>
      prisma.lifeGuide.findMany({
        where: { kind: "PHRASE", domain: { not: "STUDY" } },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: listSelect,
      }),
    []
  );
  return rows[0] ?? null;
}
