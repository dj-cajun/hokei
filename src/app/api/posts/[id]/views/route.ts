import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

const VIEW_COOKIE_PREFIX = "hokei_pv_";
const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24;

type RouteContext = { params: Promise<{ id: string }> };

function viewCookieName(postId: string): string {
  return `${VIEW_COOKIE_PREFIX}${postId}`;
}

export async function POST(request: Request, context: RouteContext) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  try {
    const { id } = await context.params;
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!post || post.status !== "PUBLISHED") {
      return apiError("글을 찾을 수 없습니다.", 404);
    }

    const cookieName = viewCookieName(id);
    if (request.cookies.get(cookieName)?.value === "1") {
      return apiSuccess({ counted: false });
    }

    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const res = NextResponse.json({ ok: true, counted: true });
    res.cookies.set(cookieName, "1", {
      maxAge: VIEW_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    log("error", "post views increment failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("조회수 처리에 실패했습니다.", 500);
  }
}
