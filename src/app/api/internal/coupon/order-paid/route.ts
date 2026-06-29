import { z } from "zod";
import { ensureCouponOrderConversation } from "@/lib/coupon/order-conversation";
import { log } from "@/lib/logger";
import { NextResponse } from "next/server";

const bodySchema = z.object({
  orderId: z.string().min(1),
  buyerUserId: z.string().min(1),
  agencyLoginId: z.string().min(1),
  productName: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.string().min(1),
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

  try {
    const result = await ensureCouponOrderConversation(parsed.data);
    if (!result) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "no_partner_owner",
      });
    }

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      created: result.created,
    });
  } catch (err) {
    log("error", "coupon order-paid conversation failed", {
      orderId: parsed.data.orderId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { message: "대화를 생성하지 못했습니다." },
      { status: 500 },
    );
  }
}
