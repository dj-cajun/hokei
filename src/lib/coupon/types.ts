export type ProductDto = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  agencyId: string;
  agencyName: string;
  agencyLoginId: string;
};

export type CouponDto = {
  id: string;
  status: string;
  productName: string;
  productId: string;
  orderId?: string | null;
  issuedAt: string;
  redeemedAt: string | null;
};

export type OrderDto = {
  id: string;
  status: string;
  amount: number;
  productName: string;
  productId: string;
  paymentMethod?: "bank_qr" | "cash_at_store";
};

export type PaymentQrInfo = {
  orderId: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  transferNote: string;
  autoApproveEnabled?: boolean;
  agencyName?: string;
};

export type PendingCashOrderDto = {
  id: string;
  status: string;
  amount: number;
  productName: string;
  paymentMethod: string;
  buyerName: string;
  createdAt: string;
};

export type RedemptionTokenResponse = {
  token: string;
  qrPayload: string;
  expiresAt: string;
  serverTime: string;
  ttlSec: number;
};

export type ScanResponse =
  | {
      success: true;
      productName: string;
      amount: number;
      productPrice?: number;
      currency: string;
      redeemedAt: string;
    }
  | {
      success: false;
      code: string;
      message: string;
    };

export type DashboardSummary = {
  weekCount: number;
  weekPlatformFee: number;
  pendingPlatformFee: number;
  commissionFixed: number;
  nextSettlementDate: string;
  currency: string;
  weekRevenue?: number;
  pendingBalance?: number;
};

export type TransactionDto = {
  id: string;
  productName: string;
  amount: number;
  productPrice?: number | null;
  occurredAt: string;
};

export type WeeklyFeeReport = {
  weekStart: string;
  weekEnd: string;
  agencies: {
    agencyId: string;
    agencyName: string;
    loginId: string;
    commissionFixed: number;
    weekRedemptionCount: number;
    weekPlatformFee: number;
    pendingPlatformFee: number;
  }[];
};

export type HokeiUserHeaders = {
  userId?: string;
  email?: string | null;
  name?: string | null;
};
