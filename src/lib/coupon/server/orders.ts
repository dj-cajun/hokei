import { CouponAuditAction, CouponPaymentMethod } from "@/generated/prisma/client";
import { ensureCouponOrderConversation } from "@/lib/coupon/order-conversation";
import { prisma } from "@/lib/prisma";
import { assertStaffIfRequired, logCouponAudit } from "./audit";
import {
  buildVietQrImageUrl,
  extractOrderPrefixFromTransferNote,
  resolveBankAcqId,
} from "./common/vietqr";
import { issueWalletItemFromOrder } from "./coupons";
import { CouponApiError } from "./errors";
import { resolveCouponUserId } from "./user";

function normalizePaymentMethod(value?: string): CouponPaymentMethod {
  if (value === "cash_at_store") return CouponPaymentMethod.cash_at_store;
  return CouponPaymentMethod.bank_qr;
}

export async function createOrder(
  productId: string,
  paymentMethodInput?: string,
  userIdHeader?: string,
) {
  const userId = await resolveCouponUserId(userIdHeader);
  const paymentMethod = normalizePaymentMethod(paymentMethodInput);
  const product = await prisma.couponProduct.findFirst({
    where: { id: productId, isActive: true },
    include: { agency: true },
  });
  if (!product) {
    throw new CouponApiError(404, "NOT_FOUND", "Product not found");
  }

  return prisma.couponOrder.create({
    data: {
      userId,
      productId,
      amount: product.price,
      status: "pending_payment",
      paymentMethod,
    },
    include: { product: true },
  });
}

export async function getPaymentQr(orderId: string, userIdHeader?: string) {
  const userId = await resolveCouponUserId(userIdHeader);
  const order = await prisma.couponOrder.findFirst({
    where: { id: orderId, userId },
    include: { product: { include: { agency: true } } },
  });
  if (!order) {
    throw new CouponApiError(404, "NOT_FOUND", "Order not found");
  }
  if (order.paymentMethod === CouponPaymentMethod.cash_at_store) {
    throw new CouponApiError(400, "BAD_REQUEST", "Cash orders do not use bank QR");
  }

  const agency = order.product.agency;
  const bankName = agency.bankName ?? "Vietcombank";
  const bankAccount = agency.bankAccount ?? "0000000000";
  const bankHolder = agency.bankHolder ?? agency.name;
  const transferNote = `CAFE-${order.id.slice(0, 8).toUpperCase()}`;
  const amount = Number(order.amount);

  return {
    orderId: order.id,
    amount,
    bankName,
    bankAccount,
    bankHolder,
    transferNote,
    autoApproveEnabled: isVietQrAutoApproveEnabled(),
    agencyName: agency.name,
    bankAcqId: resolveBankAcqId(bankName),
    vietQrImageUrl:
      buildVietQrImageUrl({
        bankName,
        bankAccount,
        amount,
        transferNote,
        bankHolder,
      }) ?? undefined,
  };
}

export async function confirmDeposit(orderId: string, userIdHeader?: string) {
  const userId = await resolveCouponUserId(userIdHeader);
  const order = await prisma.couponOrder.findFirst({
    where: { id: orderId, userId, status: "pending_payment" },
  });
  if (!order) {
    throw new CouponApiError(404, "NOT_FOUND", "Order not found");
  }
  if (order.paymentMethod === CouponPaymentMethod.cash_at_store) {
    throw new CouponApiError(400, "BAD_REQUEST", "Cash orders are confirmed at the store");
  }

  return prisma.couponOrder.update({
    where: { id: orderId },
    data: { status: "payment_pending_review" },
  });
}

export async function getOrder(orderId: string, userIdHeader?: string) {
  const userId = await resolveCouponUserId(userIdHeader);
  const order = await prisma.couponOrder.findFirst({
    where: { id: orderId, userId },
    include: { product: true },
  });
  if (!order) {
    throw new CouponApiError(404, "NOT_FOUND", "Order not found");
  }
  return {
    id: order.id,
    status: order.status,
    amount: Number(order.amount),
    productName: order.product.name,
    productId: order.productId,
    paymentMethod: order.paymentMethod,
  };
}

export async function approvePayment(orderId: string) {
  const order = await prisma.couponOrder.update({
    where: { id: orderId },
    data: { status: "paid", paidAt: new Date() },
  });
  await issueWalletItemFromOrder(orderId);

  const full = await prisma.couponOrder.findUnique({
    where: { id: orderId },
    include: { product: { include: { agency: true } } },
  });
  if (full) {
    void ensureCouponOrderConversation({
      orderId: full.id,
      buyerUserId: full.userId,
      agencyLoginId: full.product.agency.loginId,
      productName: full.product.name,
      amount: Number(full.amount),
      paymentMethod: full.paymentMethod,
    });
  }

  return order;
}

export async function listPendingReview() {
  return prisma.couponOrder.findMany({
    where: {
      status: "payment_pending_review",
      paymentMethod: CouponPaymentMethod.bank_qr,
    },
    include: { product: true, buyer: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPendingCash(agencyId: string) {
  const rows = await prisma.couponOrder.findMany({
    where: {
      status: "pending_payment",
      paymentMethod: CouponPaymentMethod.cash_at_store,
      product: { agencyId },
    },
    include: { product: true, buyer: true },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((o) => ({
    id: o.id,
    status: o.status,
    amount: Number(o.amount),
    productName: o.product.name,
    paymentMethod: o.paymentMethod,
    buyerName: o.buyer.name,
    createdAt: o.createdAt.toISOString(),
  }));
}

export async function confirmCashByAgency(
  orderId: string,
  agencyId: string,
  staffId?: string | null,
) {
  await assertStaffIfRequired(agencyId, staffId);

  const order = await prisma.couponOrder.findFirst({
    where: {
      id: orderId,
      status: "pending_payment",
      paymentMethod: CouponPaymentMethod.cash_at_store,
      product: { agencyId },
    },
  });
  if (!order) {
    throw new CouponApiError(404, "NOT_FOUND", "Order not found");
  }
  await approvePayment(orderId);
  await logCouponAudit(agencyId, CouponAuditAction.cash_confirmed, staffId, {
    orderId,
    amount: Number(order.amount),
  });
  return { success: true, orderId, status: "paid" };
}

export async function processVietQrWebhook(input: {
  amount: number;
  description: string;
  transactionId?: string;
}) {
  const prefix = extractOrderPrefixFromTransferNote(input.description);
  if (!prefix) {
    return { received: true, matched: false, reason: "no_order_ref" };
  }

  const order = await prisma.couponOrder.findFirst({
    where: {
      id: { startsWith: prefix },
      paymentMethod: CouponPaymentMethod.bank_qr,
      status: { in: ["pending_payment", "payment_pending_review"] },
    },
  });

  if (!order) {
    return { received: true, matched: false, reason: "order_not_found" };
  }

  if (order.status === "paid") {
    return {
      received: true,
      matched: true,
      orderId: order.id,
      status: "paid",
      duplicate: true,
    };
  }

  if (Number(order.amount) !== input.amount) {
    return {
      received: true,
      matched: false,
      reason: "amount_mismatch",
      expected: Number(order.amount),
      got: input.amount,
    };
  }

  if (
    order.paymentRef &&
    input.transactionId &&
    order.paymentRef === input.transactionId
  ) {
    return {
      received: true,
      matched: true,
      orderId: order.id,
      status: order.status,
      duplicate: true,
    };
  }

  await approvePayment(order.id);

  if (input.transactionId) {
    await prisma.couponOrder.update({
      where: { id: order.id },
      data: { paymentRef: input.transactionId },
    });
  }

  return { received: true, matched: true, orderId: order.id, status: "paid" };
}

export function isVietQrAutoApproveEnabled() {
  return process.env.VIETQR_AUTO_APPROVE === "true";
}

export function formatCreateOrderResponse(order: {
  id: string;
  status: string;
  amount: { toString(): string } | number;
  product: { name: string };
  productId: string;
  paymentMethod: string;
}) {
  return {
    id: order.id,
    status: order.status,
    amount: Number(order.amount),
    productName: order.product.name,
    productId: order.productId,
    paymentMethod: order.paymentMethod,
  };
}
