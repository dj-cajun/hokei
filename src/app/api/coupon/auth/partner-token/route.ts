import { auth } from "@/auth";
import { agencyLoginIdForStore, COUPON_API_URL, isCouponStore } from "@/lib/coupon/config";
import { getPartnerStoreByOwnerId } from "@/lib/partner/queries";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const store = await getPartnerStoreByOwnerId(session.user.id);
  if (!store || !isCouponStore(store.slug)) {
    return NextResponse.json(
      { message: "쿠폰 연동 제휴 업소가 없습니다." },
      { status: 403 },
    );
  }

  const agencyLoginId = agencyLoginIdForStore(store.slug);
  if (!agencyLoginId) {
    return NextResponse.json({ message: "업소 매핑이 없습니다." }, { status: 403 });
  }

  const internalSecret = process.env.COUPON_INTERNAL_SECRET?.trim();
  if (!internalSecret) {
    return NextResponse.json(
      { message: "COUPON_INTERNAL_SECRET 미설정" },
      { status: 503 },
    );
  }

  const res = await fetch(`${COUPON_API_URL}/auth/hokei-partner`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Coupon-Internal-Secret": internalSecret,
    },
    body: JSON.stringify({
      agencyLoginId,
      hokeiUserId: session.user.id,
    }),
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    token?: string;
    agency?: { name: string };
    message?: string;
  };

  if (!res.ok || !data.success || !data.token) {
    return NextResponse.json(
      { message: data.message ?? "쿠폰 토큰 발급 실패" },
      { status: res.status === 200 ? 502 : res.status },
    );
  }

  return NextResponse.json({
    success: true,
    token: data.token,
    agencyName: data.agency?.name,
    storeSlug: store.slug,
  });
}
