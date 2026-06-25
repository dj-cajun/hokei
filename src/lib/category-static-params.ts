import { CATEGORY_MASTER, type CategoryChildSeed } from "../../prisma/seed-categories";
import type { CategoryNavItem } from "@/lib/category-types";

function mapSeedChild(
  sectionSlug: string,
  pathPrefix: string,
  colorClass: string,
  child: CategoryChildSeed
): CategoryNavItem {
  const href = `${pathPrefix}/${child.slug}`;
  const fullSlug = href.split("/").filter(Boolean).join("-");

  return {
    id: `static-${fullSlug}`,
    slug: fullSlug,
    label: child.label,
    description: child.description,
    href,
    icon: child.icon,
    colorClass,
    children: (child.children ?? []).map((grand) =>
      mapSeedChild(sectionSlug, href, colorClass, grand)
    ),
  };
}

/** DB 없이 빌드·프리렌더 시 사용 (Vercel 등) */
export const STATIC_SECTION_PARAMS = CATEGORY_MASTER.map((section) => ({
  section: section.slug,
}));

/** 2단계 leaf — /section/slug */
export const STATIC_SUBCATEGORY_PARAMS = CATEGORY_MASTER.flatMap((section) =>
  section.children.flatMap((child) => {
    if (child.children?.length) return [];
    return [{ section: section.slug, slug: child.slug }];
  })
);

/** 3단계 leaf — /section/mid/child */
export const STATIC_NESTED_LEAF_PARAMS = CATEGORY_MASTER.flatMap((section) =>
  section.children.flatMap((child) =>
    (child.children ?? []).map((grand) => ({
      section: section.slug,
      slug: child.slug,
      child: grand.slug,
    }))
  )
);

export function findStaticSection(slug: string): CategoryNavItem | null {
  return staticCategoryTree().find((section) => section.slug === slug) ?? null;
}

export function findStaticCategoryByHref(href: string) {
  const parts = href.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const section = CATEGORY_MASTER.find((s) => s.slug === parts[0]);
  if (!section) return null;

  const sectionNav = {
    id: `static-${section.slug}`,
    slug: section.slug,
    label: section.label,
    description: section.description,
    href: `/${section.slug}`,
    icon: section.icon,
    colorClass: section.colorClass,
  };

  if (parts.length === 2) {
    const child = section.children.find((c) => c.slug === parts[1]);
    if (!child) return null;
    const fullSlug = parts.join("-");
    const mappedChildren = (child.children ?? []).map((grand) =>
      mapSeedChild(sectionSlug, href, section.colorClass, grand)
    );
    return {
      id: `static-${fullSlug}`,
      slug: fullSlug,
      label: child.label,
      description: child.description,
      href,
      icon: child.icon,
      colorClass: section.colorClass,
      parent: sectionNav,
      children: mappedChildren,
    };
  }

  const mid = section.children.find((c) => c.slug === parts[1]);
  const leaf = mid?.children?.find((c) => c.slug === parts[2]);
  if (!mid || !leaf) return null;

  const midSlug = [parts[0], parts[1]].join("-");
  const midNav = {
    id: `static-${midSlug}`,
    slug: midSlug,
    label: mid.label,
    description: mid.description,
    href: `/${parts[0]}/${parts[1]}`,
    icon: mid.icon,
    colorClass: section.colorClass,
    parent: sectionNav,
  };

  const fullSlug = parts.join("-");
  return {
    id: `static-${fullSlug}`,
    slug: fullSlug,
    label: leaf.label,
    description: leaf.description,
    href,
    icon: leaf.icon,
    colorClass: section.colorClass,
    parent: midNav,
  };
}

/** @deprecated findStaticCategoryByHref 사용 */
export function findStaticSubcategory(sectionSlug: string, childSlug: string) {
  return findStaticCategoryByHref(`/${sectionSlug}/${childSlug}`);
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
    children: section.children.map((child) =>
      mapSeedChild(section.slug, `/${section.slug}`, section.colorClass, child)
    ),
  }));
}
