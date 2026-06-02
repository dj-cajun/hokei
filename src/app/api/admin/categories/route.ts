import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import {
  buildCategoryHref,
  createCategorySchema,
  getCategoryTreeForAdmin,
} from "@/lib/admin/categories-api";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { revalidateCategoryCaches } from "@/lib/admin/revalidate-categories";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const categories = await getCategoryTreeForAdmin();
  return apiSuccess({ categories });
}

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { session, error } = await requireAdminApi();
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 입력", 400);
  }

  const { parentId, slug, label, description, icon, colorClass, sortOrder } =
    parsed.data;

  let fullSlug = slug;
  let parentColor = colorClass ?? "bg-secondary text-muted-foreground";

  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: { slug: true, colorClass: true, parentId: true },
    });
    if (!parent || parent.parentId) {
      return apiError("1depth 섹션만 부모로 지정할 수 있습니다.", 400);
    }
    fullSlug = slug.startsWith(`${parent.slug}-`)
      ? slug
      : `${parent.slug}-${slug}`;
    if (!colorClass) parentColor = parent.colorClass;
  }

  const existing = await prisma.category.findUnique({
    where: { slug: fullSlug },
  });
  if (existing) return apiError("이미 사용 중인 slug입니다.", 409);

  const maxOrder = await prisma.category.aggregate({
    where: { parentId: parentId ?? null },
    _max: { sortOrder: true },
  });

  const href = await buildCategoryHref(parentId, fullSlug);

  const created = await prisma.category.create({
    data: {
      slug: fullSlug,
      label,
      description: description ?? null,
      icon,
      colorClass: parentColor,
      href,
      sortOrder: sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
      parentId,
      isActive: true,
    },
  });

  revalidateCategoryCaches();
  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "CATEGORY_CREATE",
    targetType: "Category",
    targetId: created.id,
    request,
  });
  return apiSuccess({ category: created }, 201);
}
