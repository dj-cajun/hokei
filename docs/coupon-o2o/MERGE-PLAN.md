# MERGE-PLAN — 호케이2 + 쿠폰 → 서버 하나

> **목표:** 로컬·프로덕션 모두 **프로세스 1개(Next.js)** 로 쿠폰까지 서빙.  
> **작업 폴더:** `~/Desktop/호케이2` · **프로덕션 원본:** `~/Desktop/호케이` (머지 전까지 수정 금지)

---

## 1. 현재 vs 목표

### 현재 (2서버)

```
브라우저
  → 호케이2 Next.js :3001  (UI + /api/coupon/* 프록시)
       → coupon-pilot NestJS :3020
            → PostgreSQL cafe_o2o
  → 호케이2 Neon DB (User, PartnerStore, Conversation…)
```

- env 2벌 · 배포 2곳 · `COUPON_INTERNAL_SECRET` 로프백(webhook)
- coupon `User` ↔ 호케이 `User` 는 **헤더 매핑**으로만 연결

### 목표 (1서버)

```
브라우저
  → 호케이 Next.js (Vercel 1 deploy)
       ├─ 페이지: /store/.../coupon/*, /account/partner/coupon/*
       ├─ API:    /api/coupon/*  (프록시 제거, 로직 내장)
       └─ Cron:   /api/cron/coupon/* (정산 등)
            → PostgreSQL (단일 Neon 권장)
```

**성공 기준**

| # | 기준 |
|---|------|
| S1 | `pnpm dev` / Vercel **한 번**만 기동해도 쿠폰 E2E 동작 |
| S2 | `NEXT_PUBLIC_COUPON_API_URL` **불필요** (또는 미사용) |
| S3 | VietQR webhook · POS scan · QR redemption 테스트 통과 |
| S4 | `main` 머지 후 프로덕션도 동일 단일 deploy |

---

## 2. 전략 선택 (권장)

### ✅ 권장: **Next.js Route Handlers로 흡수** (Strangler)

| 항목 | 결정 |
|------|------|
| 런타임 | Next.js App Router만 (Vercel 호환) |
| NestJS | 단계적으로 폐기 (`coupon-pilot` 참고용 → 삭제) |
| DB | **1단계:** Neon 1개 + `coupon_*` 테이블 추가 · **2단계(선택):** 스키마 정리 |
| 인증 | Buyer = NextAuth 세션 · Partner = `PartnerStore.ownerId` (기존 SSO 유지) |
| Agency JWT | Route Handler 내부 서비스로 이전 (localStorage 토큰 유지 가능) |

### ❌ 비권장

- Nest를 Next `custom server`로 붙이기 → Vercel 배포 어려움
- Docker 2컨테이너를 “한 서버”로만 묶기 → 여전히 운영 2곳

---

## 3. DB 통합

### Phase M-DB1 — 스키마를 호케이 Prisma로 이전

coupon-pilot 모델 → `prisma/schema.prisma` 에 네임스페이스:

```
CouponAgency, CouponProduct, CouponOrder, Coupon, RedemptionToken,
CouponTransaction, CouponSettlement, CouponAgencyStaff, CouponAuditLog, CouponPosDevice
```

- `CouponAgency.hokeiStoreSlug` ↔ `PartnerStore.slug` (FK 또는 unique)
- coupon `User` 테이블 **삭제** → `User.id` 직접 참조
- 마이그레이션: `cafe_o2o` 덤프 → Neon dev 브랜치 import 스크립트

### Phase M-DB2 — 연결 정리

- `Conversation.contextCouponOrderId` → `CouponOrder.id` (동일 DB이면 optional FK)
- `config.ts` `agencyLoginId` ↔ `CouponAgency.loginId` 유지

---

## 4. 코드 이전 맵

| coupon-pilot (Nest) | 호케이2 (Next) |
|---------------------|----------------|
| `products/*` | `src/lib/coupon/services/products.ts` + `GET /api/coupon/products` |
| `orders/*` | `src/lib/coupon/services/orders.ts` |
| `coupons/*` | `src/lib/coupon/services/coupons.ts` |
| `redemptions/*` | `src/lib/coupon/services/redemptions.ts` + **JWT signer** |
| `auth/hokei-partner` | 기존 `partner-token/route.ts` 로직 흡수 |
| `staff/*` | `src/lib/coupon/services/staff.ts` |
| `pos/*` | `src/lib/coupon/services/pos.ts` |
| `dashboard/*`, `transactions` | 동일 |
| `admin/*` | Admin Route + 기존 패널 |
| `webhooks/payment/vietqr` | `POST /api/coupon/webhooks/vietqr` |
| `settlements` cron | `POST /api/cron/coupon/settle-weekly` + `vercel.json` |
| `health` | `GET /api/coupon/health` |

**프록시 제거:** `src/app/api/coupon/[...path]/route.ts` → 라우트별 핸들러 또는 단일 dispatcher가 **in-process 서비스** 호출.

---

## 5. 단계별 작업 (Phase M)

### M0 — 준비 (1일)

| ID | Task |
|----|------|
| M0-01 | `MERGE-PLAN.md` · `TASKS.md` 에 M-phase 추가 |
| M0-02 | coupon-pilot API 엔드포인트 목록 ↔ 호케이 프록시 경로 diff |
| M0-03 | 통합 테스트 시나리오 고정 (구매 → VietQR → 쿠폰함 → 스캔) |

### M1 — DB + 서비스 골격 (3~5일)

| ID | Task |
|----|------|
| M1-01 | Prisma에 Coupon* 모델 추가 · `db push` dev |
| M1-02 | `src/lib/coupon/server/` — prisma client, env, 에러 타입 |
| M1-03 | `platform-fee`, `vietqr`, `redemption-token.signer` 포팅 |
| M1-04 | seed: 2D agency + 메뉴 (기존 seed.ts 이전) |

### M2 — Buyer API (3~4일)

| ID | Task |
|----|------|
| M2-01 | products, orders, coupons Route Handlers |
| M2-02 | payment-qr · VietQR 이미지 · confirm-deposit |
| M2-03 | `couponFetch` → `/api/coupon` 상대경로만 (이미 브라우저는 OK) |
| M2-04 | `order-paid` 내부 호출을 **함수 직접 호출**로 변경 (HTTP 제거) |

### M3 — Partner · Staff · POS (3~4일)

| ID | Task |
|----|------|
| M3-01 | partner-token · Agency JWT 발급 in-process |
| M3-02 | redemptions/scan, staff PIN, close-day |
| M3-03 | pending-cash, confirm-cash, pos/scan |
| M3-04 | Partner UI `agency: true` 헤더 — 세션/토큰 검증 Route에서 처리 |

### M4 — Admin · Cron · Webhook (2~3일)

| ID | Task |
|----|------|
| M4-01 | admin pending approve, fees weekly |
| M4-02 | VietQR webhook (secret 검증) |
| M4-03 | 주간 정산 Vercel Cron |
| M4-04 | env 정리: `COUPON_INTERNAL_SECRET` 등 축소 |

### M5 — 프로덕션·청소 (2~3일)

| ID | Task |
|----|------|
| M5-01 | `feat/coupon-o2o` QA · `main` PR |
| M5-02 | Vercel env 단일 세트 · Preview 검증 |
| M5-03 | `coupon-pilot` 폴더 deprecated · WORKSPACE 갱신 |
| M5-04 | `호케이` pull 후 worktree/호케이-coupon 정리 |

**총 예상:** 2~3주 (1인, 기존 코드 재사용 기준)

---

## 6. env 변화

### 제거·축소

```bash
# NEXT_PUBLIC_COUPON_API_URL=...     ← 삭제
# BUYER_URL / AGENCY_URL (API쪽)     ← 삭제
# COUPON_INTERNAL_SECRET (루프백)    ← order-paid 직접호출 후 삭제
```

### 유지

```bash
NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe
REDEMPTION_SIGNING_SECRET=...
JWT_SECRET=...              # Agency 토큰 (이름 통일 검토)
VIETQR_WEBHOOK_SECRET=...
VIETQR_AUTO_APPROVE=true
CRON_SECRET=...             # 정산 cron
```

---

## 7. 리스크 · 완화

| 리스크 | 완화 |
|--------|------|
| QR redemption 원자성 | coupon-pilot `$transaction` + `FOR UPDATE` 그대로 포팅 · 통합 테스트 필수 |
| Vercel serverless 타임아웃 | 스캔·webhook 10s 이내 · 무거운 정산은 Cron 분리 |
| DB 마이그레이션 실수 | Neon **dev 브랜치**만 먼저 · prod는 M5에서 |
| main 오염 | **호케이2에서만 M0~M4** · main은 PR 머지 한 번 |

---

## 8. 롤백

- M2 완료 전: 프록시 + `:3020` 즉시 복귀 가능 (`NEXT_PUBLIC_COUPON_API_URL` 스위치)
- M2 이후: feature flag `COUPON_IN_PROCESS=false` → 프록시 폴백 (M1에서 구현 권장)

---

## 9. 다음 액션

1. **M0-02** 엔드포인트 diff 작성
2. **M1-01** Prisma Coupon* 모델 초안 PR (호케이2만)
3. M1 완료 시 로컬 **터미널 1개**로 E2E 재검증

관련: [INTEGRATION.md](./INTEGRATION.md) · [WORKSPACE.md](./WORKSPACE.md)
