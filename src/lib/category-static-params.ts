import { CATEGORY_MASTER } from "../../prisma/seed-categories";
import type { CategoryNavItem } from "@/lib/category-types";

/** DB 없이 빌드·프리렌더 시 사용 (Vercel 등) */
export const STATIC_SECTION_PARAMS = CATEGORY_MASTER.map((section) => ({
  section: section.slug,
}));

export const STATIC_SUBCATEGORY_PARAMS = CATEGORY_MASTER.flatMap((section) =>
  section.children.map((child) => ({
    section: section.slug,
    slug: child.slug,
  }))
);

export function findStaticSection(slug: string): CategoryNavItem | null {
  return staticCategoryTree().find((section) => section.slug === slug) ?? null;
}

/** 서브카테고리 상세 — DB 없을 때 (slug는 URL path segment) */
export function findStaticSubcategory(sectionSlug: string, childSlug: string) {
  const section = CATEGORY_MASTER.find((s) => s.slug === sectionSlug);
  if (!section) return null;
  const child = section.children.find((c) => c.slug === childSlug);
  if (!child) return null;

  const parent = {
    id: `static-${section.slug}`,
    slug: section.slug,
    label: section.label,
    description: section.description,
    href: `/${section.slug}`,
    icon: section.icon,
    colorClass: section.colorClass,
  };

  return {
    id: `static-${section.slug}-${child.slug}`,
    slug: `${section.slug}-${child.slug}`,
    label: child.label,
    description: child.description,
    href: `/${section.slug}/${child.slug}`,
    icon: child.icon,
    colorClass: section.colorClass,
    parent,
  };
}

export function staticCategoryTree(): CategoryNavItem[] {
  return CATEGORY_MASTER.map((section) => ({
    id: `static-${section.slug}`,
    slug: section.slug,
    label: section.label,
    description: section.description,
    href: `/${section.slug}`,
    icon: section.icon,
    colorClass: section.colorClass,
    children: section.children.map((child) => ({
      id: `static-${section.slug}-${child.slug}`,
      slug: `${section.slug}-${child.slug}`,
      label: child.label,
      description: child.description,
      href: `/${section.slug}/${child.slug}`,
      icon: child.icon,
      colorClass: section.colorClass,
      children: [],
    })),
  }));
}
