import { unstable_cache } from "next/cache";
import {
  STATIC_NESTED_LEAF_PARAMS,
  STATIC_SECTION_PARAMS,
  STATIC_SUBCATEGORY_PARAMS,
  findStaticCategoryByHref,
  findStaticSection,
  staticCategoryTree,
} from "@/lib/category-static-params";
import { isDatabaseAvailable } from "@/lib/database-available";
import type { CategoryNavItem } from "@/lib/category-types";
import { prisma } from "@/lib/prisma";

export type { CategoryNavItem } from "@/lib/category-types";

type DbCategory = {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  href: string;
  icon: string;
  colorClass: string;
  children?: DbCategory[];
};

function mapDbCategory(node: DbCategory): CategoryNavItem {
  return {
    id: node.id,
    slug: node.slug,
    label: node.label,
    description: node.description,
    href: node.href,
    icon: node.icon,
    colorClass: node.colorClass,
    children: (node.children ?? []).map(mapDbCategory),
  };
}

const categoryInclude = {
  children: {
    where: { isActive: true },
    orderBy: { sortOrder: "asc" as const },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" as const },
      },
    },
  },
};

async function fetchCategoryTree(): Promise<CategoryNavItem[]> {
  if (!isDatabaseAvailable()) return staticCategoryTree();

  try {
    const sections = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: categoryInclude,
    });

    if (sections.length === 0) return staticCategoryTree();

    return sections.map(mapDbCategory);
  } catch {
    return staticCategoryTree();
  }
}

export const getCategoryTree = unstable_cache(
  fetchCategoryTree,
  ["category-tree"],
  { revalidate: 300, tags: ["category-tree"] }
);

async function fetchSectionBySlug(slug: string) {
  return prisma.category.findFirst({
    where: { slug, parentId: null, isActive: true },
    include: categoryInclude,
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

export async function getCategoryByHref(href: string) {
  if (!isDatabaseAvailable()) return findStaticCategoryByHref(href);

  try {
    const category = await prisma.category.findFirst({
      where: { href, isActive: true },
      include: {
        parent: {
          include: { parent: true },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!category) return findStaticCategoryByHref(href);
    return category;
  } catch {
    return findStaticCategoryByHref(href);
  }
}

/** @deprecated getCategoryByHref 사용 */
export async function getSubcategoryByPath(sectionSlug: string, childSlug: string) {
  return getCategoryByHref(`/${sectionSlug}/${childSlug}`);
}

export async function getNestedLeafByPath(
  sectionSlug: string,
  midSlug: string,
  leafSlug: string
) {
  return getCategoryByHref(`/${sectionSlug}/${midSlug}/${leafSlug}`);
}

export async function getSectionSlugs() {
  if (!isDatabaseAvailable()) return STATIC_SECTION_PARAMS;
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
  if (!isDatabaseAvailable()) return STATIC_SUBCATEGORY_PARAMS;
  try {
    const mids = await prisma.category.findMany({
      where: {
        isActive: true,
        parent: { parentId: null },
        children: { none: {} },
      },
      include: { parent: { select: { slug: true } } },
    });

    if (mids.length === 0) return STATIC_SUBCATEGORY_PARAMS;

    return mids
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

export async function getNestedLeafParams() {
  if (!isDatabaseAvailable()) return STATIC_NESTED_LEAF_PARAMS;
  try {
    const leaves = await prisma.category.findMany({
      where: {
        isActive: true,
        children: { none: {} },
        parent: { parentId: { not: null } },
      },
      include: {
        parent: { select: { href: true, parent: { select: { slug: true } } } },
      },
    });

    if (leaves.length === 0) return STATIC_NESTED_LEAF_PARAMS;

    return leaves
      .filter((c) => c.parent?.parent)
      .map((c) => {
        const parts = c.href.split("/").filter(Boolean);
        return {
          section: parts[0] ?? c.parent!.parent!.slug,
          slug: parts[1] ?? "",
          child: parts[2] ?? c.slug,
        };
      });
  } catch {
    return STATIC_NESTED_LEAF_PARAMS;
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
  const leaves = await prisma.category.findMany({
    where: {
      isActive: true,
      children: { none: {} },
      NOT: { parentId: null },
    },
    orderBy: [{ sortOrder: "asc" }],
    include: {
      parent: {
        include: { parent: { select: { label: true, slug: true } } },
      },
    },
  });

  return leaves
    .map((c) => {
      const root = c.parent?.parentId
        ? c.parent.parent
        : c.parent;
      const mid = c.parent?.parentId ? c.parent : null;
      if (!root || root.slug === "news") return null;
      if (sectionSlug && root.slug !== sectionSlug) return null;

      const label = mid
        ? `${mid.label} · ${c.label}`
        : `${root.label} · ${c.label}`;

      return {
        id: c.id,
        slug: c.slug,
        label,
        sectionSlug: root.slug,
        sectionLabel: root.label,
      };
    })
    .filter((c): c is WritableCategory => c !== null);
}

/** 사용자 글쓰기 가능 분류 (leaf만, 뉴스 제외) */
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
