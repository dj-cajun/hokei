import { paymentMethodLabel } from "@/lib/coupon/labels";

export type CouponOrderMessageInput = {
  orderId: string;
  productName: string;
  amount: number;
  paymentMethod: string;
};

const ORDER_MARKER_PREFIX = "[#";

export function stripCouponOrderMarker(body: string): string {
  return body.replace(/^\[#[^\]]+\]\n?/, "");
}

export function couponOrderMessageMarker(orderId: string): string {
  return `${ORDER_MARKER_PREFIX}${orderId}]`;
}

export function formatCouponOrderSystemMessage(
  input: CouponOrderMessageInput,
): string {
  const payLabel = paymentMethodLabel(input.paymentMethod);
  return `${couponOrderMessageMarker(input.orderId)}
[쿠폰 주문 안내]
${input.productName} 결제가 완료되었습니다. (${input.amount.toLocaleString("vi-VN")}₫ · ${payLabel})
쿠폰함에서 QR을 사용해 주세요. 문의는 이 대화로 이어가시면 됩니다.`;
}
