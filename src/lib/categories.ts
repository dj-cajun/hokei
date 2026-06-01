import { unstable_cache } from "next/cache";
import {
  STATIC_SECTION_PARAMS,
  STATIC_SUBCATEGORY_PARAMS,
  findStaticSection,
  findStaticSubcategory,
  staticCategoryTree,
} from "@/lib/category-static-params";
import { isDatabaseAvailable } from "@/lib/database-available";
import type { CategoryNavItem } from "@/lib/category-types";
import { prisma } from "@/lib/prisma";

export type { CategoryNavItem } from "@/lib/category-types";

function mapChild(child: {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  href: string;
  icon: string;
  colorClass: string;
}): CategoryNavItem {
  return {
    id: child.id,
    slug: child.slug,
    label: child.label,
    description: child.description,
    href: child.href,
    icon: child.icon,
    colorClass: child.colorClass,
    children: [],
  };
}

async function fetchCategoryTree(): Promise<CategoryNavItem[]> {
  if (!isDatabaseAvailable()) return staticCategoryTree();

  try {
    const sections = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (sections.length === 0) return staticCategoryTree();

    return sections.map((section) => ({
      id: section.id,
      slug: section.slug,
      label: section.label,
      description: section.description,
      href: section.href,
      icon: section.icon,
      colorClass: section.colorClass,
      children: section.children.map(mapChild),
    }));
  } catch {
    return staticCategoryTree();
  }
}

export const getCategoryTree = unstable_cache(
  fetchCategoryTree,
  ["category-tree"],
  { revalidate: 300 }
);

async function fetchSectionBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, parentId: null, isActive: true },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getSectionBySlug(slug: string) {
  if (!isDatabaseAvailable()) return findStaticSection(slug);
  return unstable_cache(
    () => fetchSectionBySlug(slug),
    ["section-by-slug", slug],
    { revalidate: 300 }
  )();
}

export async function getSubcategoryByPath(sectionSlug: string, childSlug: string) {
  if (!isDatabaseAvailable()) return findStaticSubcategory(sectionSlug, childSlug);
  try {
    return await prisma.category.findFirst({
      where: {
        href: `/${sectionSlug}/${childSlug}`,
        isActive: true,
        parent: { slug: sectionSlug },
      },
      include: { parent: true },
    });
  } catch {
    return findStaticSubcategory(sectionSlug, childSlug);
  }
}

export async function getSectionSlugs() {
  if (!isDatabaseAvailable()) return [];
  try {
    const sections = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      select: { slug: true },
    });
    if (sections.length === 0) return STATIC_SECTION_PARAMS;
    return sections.map((s) => ({ section: s.slug }));
  } catch {
    return STATIC_SECTION_PARAMS;
  }
}

export async function getSubcategoryParams() {
  if (!isDatabaseAvailable()) return [];
  try {
    const children = await prisma.category.findMany({
      where: { parentId: { not: null }, isActive: true },
      include: { parent: { select: { slug: true } } },
    });

    if (children.length === 0) return STATIC_SUBCATEGORY_PARAMS;

    return children
      .filter((c) => c.parent)
      .map((c) => {
        const parts = c.href.split("/").filter(Boolean);
        return {
          section: parts[0] ?? c.parent!.slug,
          slug: parts[1] ?? c.slug,
        };
      });
  } catch {
    return STATIC_SUBCATEGORY_PARAMS;
  }
}

export async function getAllCategoriesFlat() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }],
    include: { parent: { select: { id: true, label: true, slug: true } } },
  });
}

export type WritableCategory = {
  id: string;
  slug: string;
  label: string;
  sectionSlug: string;
  sectionLabel: string;
};

async function fetchWritableCategories(sectionSlug?: string) {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: { not: null },
      parent: {
        slug: {
          not: "news",
          ...(sectionSlug ? { equals: sectionSlug } : {}),
        },
      },
    },
    orderBy: [{ parent: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { parent: { select: { label: true, slug: true, sortOrder: true } } },
  });

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    label: c.parent ? `${c.parent.label} · ${c.label}` : c.label,
    sectionSlug: c.parent?.slug ?? "",
    sectionLabel: c.parent?.label ?? "",
  }));
}

/** 사용자 글쓰기 가능 분류 (뉴스 자동수집 제외) */
export async function getWritableCategories(options?: {
  sectionSlug?: string;
}): Promise<WritableCategory[]> {
  const sectionSlug = options?.sectionSlug;
  return unstable_cache(
    () => fetchWritableCategories(sectionSlug),
    ["writable-categories", sectionSlug ?? "all"],
    { revalidate: 300 }
  )();
}
