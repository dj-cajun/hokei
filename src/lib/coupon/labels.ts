/** 호케이 DM(/messages)과 구분 — O2O 쿠폰 보관함 */
export const COUPON_WALLET_TITLE = "쿠폰함";
export const COUPON_WALLET_SHORT = "쿠폰함";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "결제 대기",
  payment_pending_review: "입금 확인 중",
  paid: "결제 완료",
  cancelled: "취소됨",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bank_qr: "업소 계좌 QR",
  cash_at_store: "매장 현금",
};

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
