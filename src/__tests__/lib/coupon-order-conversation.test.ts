import { describe, it, expect } from "vitest";
import {
  couponOrderMessageMarker,
  formatCouponOrderSystemMessage,
  stripCouponOrderMarker,
} from "@/lib/coupon/order-conversation-format";

describe("coupon order conversation messages", () => {
  it("formats system message with marker and payment label", () => {
    const body = formatCouponOrderSystemMessage({
      orderId: "ord-123",
      productName: "Americano",
      amount: 45000,
      paymentMethod: "cash_at_store",
    });
    expect(body.startsWith(couponOrderMessageMarker("ord-123"))).toBe(true);
    expect(body).toContain("Americano");
    expect(body).toContain("매장 현금");
    expect(stripCouponOrderMarker(body)).not.toContain("[#ord-123]");
  });
});
