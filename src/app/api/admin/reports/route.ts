import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiSuccess } from "@/lib/api-response";
import { requireAdminApi } from "@/lib/admin/require-admin-api";
import { prisma } from "@/lib/prisma";
import type { ReportStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as ReportStatus | "ALL") || "OPEN";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 30));

  const reports = await prisma.contentReport.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const enriched = await Promise.all(
    reports.map(async (r) => {
      let title = "";
      let href = "";
      if (r.targetType === "POST") {
        const post = await prisma.post.findUnique({
          where: { id: r.targetId },
          select: { title: true },
        });
        title = post?.title ?? "(삭제됨)";
        href = `/posts/${r.targetId}`;
      } else {
        const comment = await prisma.comment.findUnique({
          where: { id: r.targetId },
          include: { post: { select: { id: true, title: true } } },
        });
        title = comment?.post.title ?? "(삭제됨)";
        href = comment ? `/posts/${comment.post.id}#comment-${r.targetId}` : "#";
      }
      return {
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
        targetTitle: title,
        targetHref: href,
      };
    })
  );

  return apiSuccess({ reports: enriched });
}
