import { z } from "zod";
import { prisma } from "@/lib/prisma";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  parentId: z.string().cuid().nullable(),
  slug: z.string().min(2).max(80).regex(slugRegex),
  label: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  icon: z.string().min(1).max(40).default("Folder"),
  colorClass: z.string().max(120).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const patchCategorySchema = z.object({
  label: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().min(1).max(40).optional(),
  colorClass: z.string().max(120).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function buildCategoryHref(
  parentId: string | null,
  slug: string
): Promise<string> {
  if (!parentId) return `/${slug}`;
  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: { slug: true },
  });
  if (!parent) throw new Error("부모 카테고리를 찾을 수 없습니다.");
  const childPart = slug.startsWith(`${parent.slug}-`)
    ? slug.slice(parent.slug.length + 1)
    : slug;
  return `/${parent.slug}/${childPart}`;
}

export async function getCategoryTreeForAdmin() {
  const all = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: {
      parent: { select: { id: true, label: true, slug: true } },
      _count: { select: { posts: true, children: true } },
    },
  });
  return all;
}
