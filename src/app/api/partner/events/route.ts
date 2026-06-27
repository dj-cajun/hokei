import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { enforcePreset } from "@/lib/api/enforce-rate-limit";
import { apiError, apiSuccess } from "@/lib/api-response";
import { log } from "@/lib/logger";
import {
  hasPartnerViewCookie,
  partnerViewCookieName,
  PARTNER_VIEW_COOKIE_MAX_AGE_SEC,
} from "@/lib/partner/partner-event-cookie";
import { publishedPartnerWhere } from "@/lib/partner/queries";
import { partnerEventCreateSchema } from "@/lib/partner/validate";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function hashUserAgent(ua: string): string {
  return createHash("sha256").update(ua).digest("hex").slice(0, 16);
}

export async function POST(request: Request) {
  const limited = await enforcePreset(request, "general");
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("잘못된 JSON입니다.", 400);
  }

  const parsed = partnerEventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.",
      400
    );
  }

  const { slug, eventType } = parsed.data;

  try {
    const store = await prisma.partnerStore.findFirst({
      where: {
        slug: slug.trim(),
        ...publishedPartnerWhere(),
      },
      select: { id: true },
    });

    if (!store) {
      return apiError("업소를 찾을 수 없습니다.", 404);
    }

    if (eventType === "VIEW") {
      if (hasPartnerViewCookie(request, store.id)) {
        return apiSuccess({ counted: false });
      }
    }

    const ua = request.headers.get("user-agent") ?? "";

    await prisma.partnerEvent.create({
      data: {
        storeId: store.id,
        eventType,
        userAgentHash: ua ? hashUserAgent(ua) : null,
      },
    });

    const res = NextResponse.json({ ok: true, counted: true });
    if (eventType === "VIEW") {
      res.cookies.set(partnerViewCookieName(store.id), "1", {
        maxAge: PARTNER_VIEW_COOKIE_MAX_AGE_SEC,
        path: "/",
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  } catch (err) {
    log("error", "partner event create failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return apiError("이벤트 기록에 실패했습니다.", 500);
  }
}
