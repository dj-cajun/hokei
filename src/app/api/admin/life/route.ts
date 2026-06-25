import { z } from "zod";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { writeAdminAudit } from "@/lib/admin/audit-log";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug는 영문 소문자·숫자·하이픈만"),
  kind: z.enum(["PHRASE", "DOC"]),
  domain: z.enum([
    "CLOTHES",
    "FOOD",
    "HOUSING",
    "ADMIN",
    "TRANSPORT",
    "EDUCATION",
    "STUDY",
  ]),
  title: z.string().min(1).max(200),
  vnText: z.string().max(500).optional(),
  body: z.string().min(1).max(20000),
  audioUrl: z.string().url().max(500).optional(),
  fileUrl: z.string().url().max(500).optional(),
  imageUrl: z.string().url().max(500).optional(),
  sourceLabel: z.string().max(120).optional(),
  externalUrl: z.string().url().max(500).optional(),
  isCrawl: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const dynamic = "force-dynamic";

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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", 400);
  }

  const existing = await prisma.lifeGuide.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return apiError("이미 사용 중인 slug입니다.", 409);
  }

  const item = await prisma.lifeGuide.create({
    data: {
      slug: parsed.data.slug,
      kind: parsed.data.kind,
      domain: parsed.data.domain,
      title: parsed.data.title,
      vnText: parsed.data.vnText ?? null,
      body: parsed.data.body,
      audioUrl: parsed.data.audioUrl ?? null,
      fileUrl: parsed.data.fileUrl ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      sourceLabel: parsed.data.sourceLabel ?? null,
      externalUrl: parsed.data.externalUrl ?? null,
      isCrawl: parsed.data.isCrawl ?? false,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  await writeAdminAudit({
    actorId: session!.user!.id,
    action: "LIFE_GUIDE_CREATE",
    targetType: "LifeGuide",
    targetId: item.id,
    request,
  });

  return apiSuccess({ item: { slug: item.slug, id: item.id } });
}
