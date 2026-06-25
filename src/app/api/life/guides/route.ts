import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "slug는 영문 소문자·숫자·하이픈만"),
  kind: z.enum(["PHRASE", "DOC"]).default("PHRASE"),
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
  imageUrl: z.string().url().max(500).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  const session = await auth();
  if (!session?.user?.id) {
    return apiError("로그인이 필요합니다.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const existing = await prisma.lifeGuide.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return apiError("이미 사용 중인 slug입니다. 제목을 조금 바꿔 주세요.", 409);
  }

  const item = await prisma.lifeGuide.create({
    data: {
      slug: parsed.data.slug,
      kind: parsed.data.kind,
      domain: parsed.data.domain,
      title: parsed.data.title,
      vnText: parsed.data.vnText ?? null,
      body: parsed.data.body,
      imageUrl: parsed.data.imageUrl ?? null,
      isCrawl: false,
      authorId: session.user.id,
    },
  });

  return apiSuccess({ item: { slug: item.slug, id: item.id } });
}
