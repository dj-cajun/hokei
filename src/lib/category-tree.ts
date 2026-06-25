import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** 섹션(최상위) 또는 중간·하위 카테고리의 모든 leaf slug 수집 */
export async function collectDescendantCategorySlugs(
  categoryId: string
): Promise<string[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, parentId: true },
  });

  const byParent = new Map<string | null, typeof rows>();
  for (const row of rows) {
    const key = row.parentId;
    const list = byParent.get(key) ?? [];
    list.push(row);
    byParent.set(key, list);
  }

  const slugs: string[] = [];
  const stack = [categoryId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    const node = rows.find((r) => r.id === id);
    if (node) slugs.push(node.slug);
    const kids = byParent.get(id) ?? [];
    for (const kid of kids) stack.push(kid.id);
  }

  const leafSlugs = slugs.filter((slug) => {
    const row = rows.find((r) => r.slug === slug)!;
    return (byParent.get(row.id) ?? []).length === 0;
  });

  return leafSlugs.length > 0 ? leafSlugs : slugs;
}

/** 게시글은 leaf 카테고리에만 붙음 — 중간 부모는 하위 leaf 전체 포함 */
export function postsInCategoryTreeWhere(
  categorySlugs: string[]
): Prisma.PostWhereInput {
  return {
    category: {
      OR: [
        { slug: { in: categorySlugs } },
        { parent: { slug: { in: categorySlugs } } },
        { parent: { parent: { slug: { in: categorySlugs } } } },
      ],
    },
  };
}

/** 섹션 slug — 직계 자식 + 중간 부모 아래 leaf */
export function postsInSectionWhere(
  sectionSlug: string
): Prisma.PostWhereInput {
  return {
    category: {
      OR: [
        { parent: { slug: sectionSlug } },
        { parent: { parent: { slug: sectionSlug } } },
      ],
    },
  };
}

export async function getRootSectionSlug(
  categoryId: string
): Promise<string | null> {
  let id: string | null = categoryId;
  let rootSlug: string | null = null;
  while (id) {
    const row: { slug: string; parentId: string | null } | null =
      await prisma.category.findUnique({
        where: { id },
        select: { slug: true, parentId: true },
      });
    if (!row) break;
    rootSlug = row.slug;
    id = row.parentId;
  }
  return rootSlug;
}

export async function resolveSectionSlugForCategory(
  categoryId: string
): Promise<string> {
  return (await getRootSectionSlug(categoryId)) ?? "";
}
