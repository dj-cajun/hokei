import { loginAgency, issuePartnerTokenForHokei, buildAgencyContext } from "./auth";
import {
  getCouponSummary,
  getCouponById,
  issueToken,
  listCouponsByUser,
  refreshToken,
} from "./coupons";
import {
  getDashboardSummary,
  getWeeklyPlatformFeeReport,
  listTransactions,
} from "./dashboard";
import { CouponApiError, isCouponApiError } from "./errors";
import { checkCouponHealth } from "./health";
import {
  approvePayment,
  confirmCashByAgency,
  confirmDeposit,
  createOrder,
  formatCreateOrderResponse,
  getOrder,
  getPaymentQr,
  listPendingCash,
  listPendingReview,
  processVietQrWebhook,
} from "./orders";
import {
  createPosDevice,
  listPosDevices,
  posScan,
  resolvePosDevice,
  revokePosDevice,
} from "./pos";
import { scanRedemption } from "./redemptions";
import { getProductById, listActiveProducts } from "./products";
import { runWeeklySettlement } from "./settlements";
import {
  assertManager,
  closeDay,
  hasActiveStaff,
  listStaffForAgency,
  verifyStaffPin,
} from "./staff";
import { resolveCouponUserId } from "./user";

export type CouponApiResult = {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
};

function normalizeHeaders(
  headers: Headers | Record<string, string | undefined>,
): Record<string, string | undefined> {
  if (headers instanceof Headers) {
    const out: Record<string, string | undefined> = {};
    headers.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  const out: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    out[key.toLowerCase()] = value;
  }
  return out;
}

function getHeader(
  headers: Record<string, string | undefined>,
  name: string,
): string | undefined {
  return headers[name.toLowerCase()];
}

function assertInternalSecret(headers: Record<string, string | undefined>) {
  const expected = process.env.COUPON_INTERNAL_SECRET?.trim();
  const header = getHeader(headers, "x-coupon-internal-secret");
  if (!expected || header !== expected) {
    throw new CouponApiError(401, "UNAUTHORIZED", "Invalid internal secret");
  }
}

function assertVietQrSecret(headers: Record<string, string | undefined>) {
  const expected = process.env.VIETQR_WEBHOOK_SECRET?.trim();
  const header = getHeader(headers, "x-vietqr-secret");
  if (!expected || header !== expected) {
    throw new CouponApiError(401, "UNAUTHORIZED", "Invalid webhook secret");
  }
}

async function requireAgency(
  headers: Record<string, string | undefined>,
  cookieHeader?: string,
) {
  const ctx = await buildAgencyContext(headers, cookieHeader);
  if (!ctx) {
    throw new CouponApiError(401, "UNAUTHORIZED", "Unauthorized");
  }
  return ctx;
}

async function requirePos(
  headers: Record<string, string | undefined>,
) {
  const raw =
    getHeader(headers, "x-pos-api-key") ??
    (getHeader(headers, "authorization")?.startsWith("Pos ")
      ? getHeader(headers, "authorization")!.slice(4)
      : undefined);

  if (!raw?.trim()) {
    throw new CouponApiError(401, "UNAUTHORIZED", "POS API key required");
  }

  const resolved = await resolvePosDevice(raw);
  if (!resolved) {
    throw new CouponApiError(401, "UNAUTHORIZED", "Invalid POS API key");
  }
  return resolved;
}

function parseBody<T extends Record<string, unknown>>(body: unknown): T {
  if (body && typeof body === "object") return body as T;
  return {} as T;
}

function loginCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = 7 * 24 * 60 * 60;
  return `agency_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function clearLoginCookieHeader(): string {
  return "agency_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
}

function matchPath(
  path: string,
  pattern: string,
): Record<string, string> | null {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i]!;
    const pv = pathParts[i]!;
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = pv;
    } else if (pp !== pv) {
      return null;
    }
  }
  return params;
}

export async function handleCouponRequest(
  method: string,
  path: string,
  reqHeaders: Headers | Record<string, string | undefined>,
  body?: unknown,
  searchParams?: URLSearchParams,
): Promise<CouponApiResult> {
  const headers = normalizeHeaders(reqHeaders);
  const cookieHeader = getHeader(headers, "cookie");
  const m = method.toUpperCase();
  const normalizedPath = path.replace(/^\/+/, "").replace(/\/+$/, "");

  try {
    // 1. POST auth/login
    if (m === "POST" && normalizedPath === "auth/login") {
      const dto = parseBody<{ loginId?: string; password?: string }>(body);
      const result = await loginAgency(dto.loginId ?? "", dto.password ?? "");
      if (!result) {
        return {
          status: 200,
          body: {
            success: false,
            message: "아이디 또는 비밀번호가 올바르지 않습니다.",
          },
        };
      }
      return {
        status: 200,
        body: {
          success: true,
          agency: result.agency,
          token: result.token,
        },
        headers: { "Set-Cookie": loginCookieHeader(result.token) },
      };
    }

    // 2. POST auth/hokei-partner
    if (m === "POST" && normalizedPath === "auth/hokei-partner") {
      assertInternalSecret(headers);
      const dto = parseBody<{ agencyLoginId?: string; hokeiUserId?: string }>(
        body,
      );
      const result = await issuePartnerTokenForHokei(
        dto.agencyLoginId ?? "",
        dto.hokeiUserId ?? "",
      );
      if (!result) {
        return {
          status: 200,
          body: {
            success: false,
            message: "연동된 쿠폰 업소를 찾을 수 없습니다.",
          },
        };
      }
      return {
        status: 200,
        body: {
          success: true,
          agency: result.agency,
          token: result.token,
        },
      };
    }

    // 3. POST auth/logout
    if (m === "POST" && normalizedPath === "auth/logout") {
      return {
        status: 200,
        body: { success: true },
        headers: { "Set-Cookie": clearLoginCookieHeader() },
      };
    }

    // 4. GET health
    if (m === "GET" && normalizedPath === "health") {
      return { status: 200, body: await checkCouponHealth() };
    }

    // 5. GET products
    if (m === "GET" && normalizedPath === "products") {
      const agency = searchParams?.get("agency")?.trim() || undefined;
      return { status: 200, body: await listActiveProducts(agency) };
    }

    // 6. GET products/:id
    {
      const params = matchPath(normalizedPath, "products/:id");
      if (m === "GET" && params) {
        const product = await getProductById(params.id);
        if (!product) {
          throw new CouponApiError(404, "NOT_FOUND", "Product not found");
        }
        return { status: 200, body: product };
      }
    }

    // 7. GET coupons
    if (m === "GET" && normalizedPath === "coupons") {
      const userId = await resolveCouponUserId(getHeader(headers, "x-user-id"));
      const agency = searchParams?.get("agency")?.trim() || undefined;
      return { status: 200, body: await listCouponsByUser(userId, agency) };
    }

    // 8-10. coupons/:id, redemption-token, refresh
    {
      const tokenParams = matchPath(
        normalizedPath,
        "coupons/:id/redemption-token/refresh",
      );
      if (m === "POST" && tokenParams) {
        const userId = await resolveCouponUserId(getHeader(headers, "x-user-id"));
        await getCouponById(tokenParams.id, userId);
        return {
          status: 200,
          body: await refreshToken(tokenParams.id, userId),
        };
      }

      const issueParams = matchPath(
        normalizedPath,
        "coupons/:id/redemption-token",
      );
      if (m === "POST" && issueParams) {
        const userId = await resolveCouponUserId(getHeader(headers, "x-user-id"));
        await getCouponById(issueParams.id, userId);
        return {
          status: 200,
          body: await issueToken(issueParams.id, userId),
        };
      }

      const couponParams = matchPath(normalizedPath, "coupons/:id");
      if (m === "GET" && couponParams) {
        const userId = await resolveCouponUserId(getHeader(headers, "x-user-id"));
        return {
          status: 200,
          body: await getCouponSummary(couponParams.id, userId),
        };
      }
    }

    // 11. POST redemptions/scan
    if (m === "POST" && normalizedPath === "redemptions/scan") {
      const ctx = await requireAgency(headers, cookieHeader);
      const dto = parseBody<{ qrPayload?: string }>(body);
      return {
        status: 200,
        body: await scanRedemption(
          dto.qrPayload ?? "",
          ctx.agency.id,
          ctx.staff?.id,
        ),
      };
    }

    // 12. POST orders
    if (m === "POST" && normalizedPath === "orders") {
      const dto = parseBody<{
        productId?: string;
        paymentMethod?: string;
      }>(body);
      const order = await createOrder(
        dto.productId ?? "",
        dto.paymentMethod,
        getHeader(headers, "x-user-id"),
      );
      return { status: 200, body: formatCreateOrderResponse(order) };
    }

    // 13. GET orders/agency/pending-cash
    if (m === "GET" && normalizedPath === "orders/agency/pending-cash") {
      const ctx = await requireAgency(headers, cookieHeader);
      return {
        status: 200,
        body: await listPendingCash(ctx.agency.id),
      };
    }

    // 14-17. orders/:id variants (order before generic :id routes handled below)
    {
      const confirmCashParams = matchPath(
        normalizedPath,
        "orders/:id/confirm-cash",
      );
      if (m === "POST" && confirmCashParams) {
        const ctx = await requireAgency(headers, cookieHeader);
        return {
          status: 200,
          body: await confirmCashByAgency(
            confirmCashParams.id,
            ctx.agency.id,
            ctx.staff?.id,
          ),
        };
      }

      const paymentQrParams = matchPath(normalizedPath, "orders/:id/payment-qr");
      if (m === "GET" && paymentQrParams) {
        return {
          status: 200,
          body: await getPaymentQr(
            paymentQrParams.id,
            getHeader(headers, "x-user-id"),
          ),
        };
      }

      const confirmDepositParams = matchPath(
        normalizedPath,
        "orders/:id/confirm-deposit",
      );
      if (m === "POST" && confirmDepositParams) {
        await confirmDeposit(
          confirmDepositParams.id,
          getHeader(headers, "x-user-id"),
        );
        return {
          status: 200,
          body: {
            success: true,
            message: "입금 확인 요청이 접수되었습니다.",
          },
        };
      }

      const orderParams = matchPath(normalizedPath, "orders/:id");
      if (m === "GET" && orderParams) {
        return {
          status: 200,
          body: await getOrder(orderParams.id, getHeader(headers, "x-user-id")),
        };
      }
    }

    // 18. POST webhooks/payment/vietqr
    if (m === "POST" && normalizedPath === "webhooks/payment/vietqr") {
      assertVietQrSecret(headers);
      const dto = parseBody<{
        amount?: number;
        description?: string;
        transactionId?: string;
      }>(body);
      return {
        status: 200,
        body: await processVietQrWebhook({
          amount: Number(dto.amount ?? 0),
          description: dto.description ?? "",
          transactionId: dto.transactionId,
        }),
      };
    }

    // 19. GET staff
    if (m === "GET" && normalizedPath === "staff") {
      const ctx = await requireAgency(headers, cookieHeader);
      return { status: 200, body: await listStaffForAgency(ctx.agency.id) };
    }

    // 20. GET staff/required
    if (m === "GET" && normalizedPath === "staff/required") {
      const ctx = await requireAgency(headers, cookieHeader);
      return {
        status: 200,
        body: { required: await hasActiveStaff(ctx.agency.id) },
      };
    }

    // 21. POST staff/verify-pin
    if (m === "POST" && normalizedPath === "staff/verify-pin") {
      const ctx = await requireAgency(headers, cookieHeader);
      const dto = parseBody<{ staffId?: string; pin?: string }>(body);
      return {
        status: 200,
        body: await verifyStaffPin(
          ctx.agency.id,
          dto.staffId ?? "",
          dto.pin ?? "",
        ),
      };
    }

    // 22. POST staff/close-day
    if (m === "POST" && normalizedPath === "staff/close-day") {
      const ctx = await requireAgency(headers, cookieHeader);
      assertManager(ctx.staff);
      return {
        status: 200,
        body: await closeDay(ctx.agency.id, ctx.staff!.id),
      };
    }

    // 23. POST pos/scan
    if (m === "POST" && normalizedPath === "pos/scan") {
      const pos = await requirePos(headers);
      const dto = parseBody<{ qrPayload?: string }>(body);
      return {
        status: 200,
        body: await posScan(
          dto.qrPayload ?? "",
          pos.agency.id,
          pos.posDevice.id,
          pos.posDevice.name,
        ),
      };
    }

    // 24. GET pos/devices
    if (m === "GET" && normalizedPath === "pos/devices") {
      const ctx = await requireAgency(headers, cookieHeader);
      return { status: 200, body: await listPosDevices(ctx.agency.id) };
    }

    // 25. POST pos/devices
    if (m === "POST" && normalizedPath === "pos/devices") {
      const ctx = await requireAgency(headers, cookieHeader);
      const dto = parseBody<{ name?: string }>(body);
      return {
        status: 200,
        body: await createPosDevice(
          ctx.agency.id,
          dto.name ?? "",
          ctx.staff!,
        ),
      };
    }

    // 26. DELETE pos/devices/:id
    {
      const deviceParams = matchPath(normalizedPath, "pos/devices/:id");
      if (m === "DELETE" && deviceParams) {
        const ctx = await requireAgency(headers, cookieHeader);
        return {
          status: 200,
          body: await revokePosDevice(
            ctx.agency.id,
            deviceParams.id,
            ctx.staff!,
          ),
        };
      }
    }

    // 27. GET dashboard/summary
    if (m === "GET" && normalizedPath === "dashboard/summary") {
      const ctx = await requireAgency(headers, cookieHeader);
      return {
        status: 200,
        body: await getDashboardSummary(ctx.agency.id, ctx.staff?.role),
      };
    }

    // 28. GET transactions
    if (m === "GET" && normalizedPath === "transactions") {
      const ctx = await requireAgency(headers, cookieHeader);
      const limitRaw = searchParams?.get("limit");
      const limit = limitRaw ? Number(limitRaw) : 20;
      return {
        status: 200,
        body: await listTransactions(ctx.agency.id, limit, ctx.staff?.role),
      };
    }

    // 29. POST settlements/run-weekly
    if (m === "POST" && normalizedPath === "settlements/run-weekly") {
      return { status: 200, body: await runWeeklySettlement(true) };
    }

    // 30. GET admin/orders/pending
    if (m === "GET" && normalizedPath === "admin/orders/pending") {
      return { status: 200, body: await listPendingReview() };
    }

    // 31. POST admin/orders/:id/approve
    {
      const approveParams = matchPath(
        normalizedPath,
        "admin/orders/:id/approve",
      );
      if (m === "POST" && approveParams) {
        await approvePayment(approveParams.id);
        return {
          status: 200,
          body: { success: true, message: "결제 승인 및 쿠폰 발급 완료" },
        };
      }
    }

    // 32. GET admin/fees/weekly
    if (m === "GET" && normalizedPath === "admin/fees/weekly") {
      return { status: 200, body: await getWeeklyPlatformFeeReport() };
    }

    throw new CouponApiError(404, "NOT_FOUND", `No route for ${m} ${normalizedPath}`);
  } catch (err) {
    if (isCouponApiError(err)) {
      const payload: Record<string, unknown> = {
        message: err.message,
        code: err.code,
      };
      if (err.details !== undefined) {
        Object.assign(payload, err.details as object);
      }
      return { status: err.status, body: payload };
    }

    throw err;
  }
}
