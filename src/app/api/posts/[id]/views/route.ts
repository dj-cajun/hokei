import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";
import {
  VIEW_COOKIE_MAX_AGE_SEC,
  hasViewCookie,
  viewCookieName,
} from "@/lib/post-view-cookie";

type RouteContext = { params: Promise<{ id: string }> };

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
    if (hasViewCookie(request, cookieName)) {
      return apiSuccess({ counted: false });
    }

    await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const res = NextResponse.json({ ok: true, counted: true });
    res.cookies.set(cookieName, "1", {
      maxAge: VIEW_COOKIE_MAX_AGE_SEC,
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
