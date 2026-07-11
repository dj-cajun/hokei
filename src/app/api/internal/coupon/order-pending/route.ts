import { z } from "zod";
import { PARTNER_COUPON_BASE, storeSlugForAgencyLoginId } from "@/lib/coupon/config";
import { createNotification } from "@/lib/notifications";
import { log } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const bodySchema = z.object({
  orderId: z.string().min(1),
  buyerUserId: z.string().min(1),
  agencyLoginId: z.string().min(1),
  productName: z.string().min(1),
  amount: z.number().positive(),
});

function verifyInternalSecret(request: Request): boolean {
  const expected = process.env.COUPON_INTERNAL_SECRET?.trim();
  if (!expected) return false;
  const got = request.headers.get("x-coupon-internal-secret")?.trim();
  return Boolean(got && got === expected);
}

export async function POST(request: Request) {
  if (!verifyInternalSecret(request)) {
    return NextResponse.json({ message: "권한이 없습니다." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { orderId, agencyLoginId, productName, amount } = parsed.data;
  const storeSlug = storeSlugForAgencyLoginId(agencyLoginId);
  if (!storeSlug) {
    return NextResponse.json({ success: true, skipped: true, reason: "unknown_agency" });
  }

  const store = await prisma.partnerStore.findFirst({
    where: { slug: storeSlug, ownerId: { not: null } },
    select: { ownerId: true, name: true },
  });

  if (!store?.ownerId) {
    return NextResponse.json({ success: true, skipped: true, reason: "no_partner_owner" });
  }

  try {
    await createNotification({
      userId: store.ownerId,
      type: "SYSTEM",
      title: "입금 확인 대기",
      body: `${productName} ${amount.toLocaleString("vi-VN")}₫ — 손님이 입금완료를 신청했습니다.`,
      href: `${PARTNER_COUPON_BASE}/orders`,
    });

    return NextResponse.json({ success: true, orderId, notifiedUserId: store.ownerId });
  } catch (err) {
    log("error", "coupon order-pending notify failed", {
      orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ message: "알림을 보내지 못했습니다." }, { status: 500 });
  }
}
