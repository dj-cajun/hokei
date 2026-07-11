# INTEGRATION — 호케이 × coupon-pilot

## 아키텍처

```
hokei.vn (:3001)
  /store/[slug]/coupon/*     → Buyer UI (Next.js)
  /account/partner/coupon/*  → Agency UI (Next.js)
        │
        │ NEXT_PUBLIC_COUPON_API_URL
        ▼
coupon-pilot API (:3020)
        │
        ▼
PostgreSQL cafe_o2o (coupon DB — 호케이 Neon DB와 분리)
```

## slug 매핑

| 호케이 PartnerStore.slug | coupon Agency.loginId |
|--------------------------|------------------------|
| `2d-sketch-cafe` | `2d_sketch_cafe` |

## Buyer 인증

호케이 NextAuth 세션 → API 요청 헤더:

```
X-User-Id: {session.user.id}
X-User-Email: {session.user.email}
X-User-Name: {session.user.name}
```

API는 User upsert 후 쿠폰·주문 처리.

## Agency 인증 (v2 SSO)

1. 호케이 `/account/partner/coupon/*` — `requireAuth()`
2. `PartnerStore.ownerId === session.user.id` 이고 slug가 쿠폰 화이트리스트에 있으면
3. `POST /api/coupon/auth/partner-token` → coupon API `POST /auth/hokei-partner`
4. JWT → localStorage `hokei_agency_token`

**폴백:** `/account/partner/coupon/login` — `2d_sketch_cafe` / `password123`

## VietQR 자동 입금 (v2)

| 항목 | 값 |
|------|-----|
| Webhook | `POST /webhooks/payment/vietqr` |
| Header | `X-Vietqr-Secret: {VIETQR_WEBHOOK_SECRET}` |
| Body | `{ amount, description, transactionId? }` |
| 매칭 | `description` 내 `CAFE-{orderId 8자}` + 금액 일치 · **bank_qr 주문만** |
| 결과 | `paid` + 쿠폰 자동 발급 |

`VIETQR_AUTO_APPROVE=true` 시 결제 QR 응답에 `autoApproveEnabled: true` (UI 안내)

## 결제 완료 → 쪽지 대화 (Phase D)

| 항목 | 값 |
|------|-----|
| Trigger | coupon API `approvePayment` (VietQR · Admin 승인 · 현금 수령) |
| 호출 | `POST {BUYER_URL}/api/internal/coupon/order-paid` |
| Header | `X-Coupon-Internal-Secret: {COUPON_INTERNAL_SECRET}` |
| Body | `{ orderId, buyerUserId, agencyLoginId, productName, amount, paymentMethod }` |
| 결과 | 구매자 ↔ `PartnerStore.ownerId` 1:1 대화 + 시스템 안내 메시지 |

`PartnerStore.ownerId` 미설정 시 대화 생성 생략 (`skipped: true`).

## 입금완료 신청 → 사장님 알림

| 항목 | 값 |
|------|-----|
| Trigger | coupon API `confirmDeposit` |
| 호출 | `POST {BUYER_URL}/api/internal/coupon/order-pending` |
| Header | `X-Coupon-Internal-Secret: {COUPON_INTERNAL_SECRET}` |
| Body | `{ orderId, buyerUserId, agencyLoginId, productName, amount }` |
| 결과 | `PartnerStore.ownerId` 에 SYSTEM 알림 → Partner 입금 승인 화면 링크 |

## 현지 직원 · 일 마감 (Phase E)

| 항목 | 값 |
|------|-----|
| 직원 목록 | `GET /staff` (Agency JWT) |
| PIN 로그인 | `POST /staff/verify-pin` `{ staffId, pin }` → `staffToken` |
| 헤더 | `X-Staff-Token: {staffToken}` (스캔·현금·마감) |
| 역할 | `cashier` · `scanner` · `manager` |
| 일 마감 | `POST /staff/close-day` (manager만) |
| 수수료 UI | manager 외 `feesHidden: true` |

시드 PIN (2d_sketch_cafe): manager `5678` · scanner `1234` · cashier `4321`

## 결제 방식 (Phase B)

| `paymentMethod` | 구매자 | Partner |
|-----------------|--------|---------|
| `bank_qr` (기본) | 업소 계좌 QR · VietQR · Admin 승인 | — |
| `cash_at_store` | 매장 현금 안내 | `GET /orders/agency/pending-cash` · `POST /orders/:id/confirm-cash` |

주문 생성: `POST /orders` `{ productId, paymentMethod?: "bank_qr" | "cash_at_store" }`

## 환경 변수

### 호케이 `.env.local`

```bash
NEXT_PUBLIC_COUPON_API_URL=http://localhost:3020
NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe
COUPON_INTERNAL_SECRET=dev-coupon-internal-secret
```

### coupon API `.env`

```bash
BUYER_URL=http://localhost:3001
AGENCY_URL=http://localhost:3001
COUPON_INTERNAL_SECRET=dev-coupon-internal-secret
VIETQR_WEBHOOK_SECRET=dev-vietqr-webhook-secret
VIETQR_AUTO_APPROVE=true
```

`COUPON_INTERNAL_SECRET` 은 **호케이 ↔ coupon API 공유** (서버 간만).

## VietQR 이미지 (Phase G-03)

`GET /orders/:id/payment-qr` 응답에 `vietQrImageUrl`, `bankAcqId` 추가 — 은행 앱 스캔용 `img.vietqr.io`.

## POS 스캔 (Phase G-04)

| 항목 | 값 |
|------|-----|
| 스캔 | `POST /pos/scan` |
| 인증 | `X-Pos-Api-Key: {발급 키}` |
| 기기 관리 | `GET/POST/DELETE /pos/devices` (Agency JWT + manager) |
| UI | `/account/partner/coupon/kiosk` · `/pos` |

→ [POS-API.md](./POS-API.md)
