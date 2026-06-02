import { z } from "zod";
import { auth } from "@/auth";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string().cuid(),
  reason: z.enum(["SPAM", "AD", "ABUSE", "OTHER"]),
  detail: z.string().max(1000).optional(),
  guestContact: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "report");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 신고 내용입니다.", 400);
  }

  const session = await auth();
  const { targetType, targetId, reason, detail, guestContact } = parsed.data;

  if (targetType === "POST") {
    const post = await prisma.post.findUnique({ where: { id: targetId } });
    if (!post) return apiError("대상 글을 찾을 수 없습니다.", 404);
  } else {
    const comment = await prisma.comment.findUnique({ where: { id: targetId } });
    if (!comment) return apiError("대상 댓글을 찾을 수 없습니다.", 404);
  }

  const open = await prisma.contentReport.findFirst({
    where: {
      targetType,
      targetId,
      status: { in: ["OPEN", "REVIEWING"] },
      ...(session?.user?.id ? { reporterId: session.user.id } : {}),
    },
  });
  if (open) {
    return apiError("이미 접수된 신고가 있습니다.", 409);
  }

  const report = await prisma.contentReport.create({
    data: {
      targetType,
      targetId,
      reason,
      detail: detail?.trim() || null,
      reporterId: session?.user?.id ?? null,
      guestContact: session?.user?.id ? null : guestContact?.trim() || null,
    },
  });

  return apiSuccess({ id: report.id }, 201);
}
