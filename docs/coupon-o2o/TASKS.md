# TASKS — 호케이 O2O 통합

로드맵: [ROADMAP.md](./ROADMAP.md) · 폴더: [WORKSPACE.md](./WORKSPACE.md)

> 개발 경로: `~/Desktop/호케이-coupon` (`feat/coupon-o2o`) · API: `coupon-pilot/`

## Baseline ✅ (I-01 ~ I-15)

| ID | Task | 상태 |
|----|------|------|
| I-01 | docs/coupon-o2o 기획 | ✅ |
| I-02 | lib/coupon + env | ✅ |
| I-03 | /store/[slug]/coupon/* Buyer | ✅ |
| I-04 | store LP CTA | ✅ |
| I-05 | /account/partner/coupon/* Agency | ✅ |
| I-06 | /admin/coupon 입금 승인 | ✅ |
| I-07 | API User upsert (Hokei session) | ✅ |
| I-08 | Buyer↔Hokei E2E 수동 QA | ✅ |
| I-09 | 업소별 메뉴·쿠폰함 필터 (agency query) | ✅ |
| I-10 | 구매/쿠폰함/QR 로그인 필수 + Admin 프록시 보호 | ✅ |
| I-11 | Agency JWT ↔ Hokei Partner SSO | ✅ |
| I-12 | VietQR 자동 입금 | ✅ |
| I-13 | API 인증 강화 (demo buyer 옵트인) | ✅ |
| I-14 | VietQR 결제 폴링 + 정산 테스트 수정 | ✅ |
| I-15 | README·운영 문서 정리 | ✅ |

---

## Phase A — 정합성

| ID | Task | 상태 |
|----|------|------|
| A-01 | UI **쿠폰함** 라벨 (DM 쪽지함과 구분) | ✅ |
| A-02 | ROADMAP.md + TASKS 정리 | ✅ |
| A-03 | `PartnerStore.ownerId` ↔ 2D 사장님 | ☐ |
| A-04 | checkout 업소 계좌 안내 copy | ✅ |
| A-05 | 프로덕션 checklist (ROADMAP §F) | ☐ |

---

## Phase B — 결제 2트랙

| ID | Task | 상태 |
|----|------|------|
| B-01 | 구매 시 **계좌 QR \| 매장 현금** 선택 | ✅ |
| B-02 | Order `paymentMethod` (coupon API) | ✅ |
| B-03 | Partner `confirm-cash` API | ✅ |
| B-04 | `/account/partner/coupon/orders` | ✅ |
| B-05 | VietQR · confirm-deposit **bank_qr만** | ✅ |

---

## Phase C — 수수료

| ID | Task | 상태 |
|----|------|------|
| C-01 | `Agency.commissionFixed` | ✅ |
| C-02 | 스캔 시 `platformFee` | ✅ |
| C-03 | Partner dashboard 수수료 표시 | ✅ |
| C-04 | Admin 수수료 리포트 | ✅ |
| C-05 | Transaction 의미 정리 | ✅ |

---

## Phase D — 채팅

| ID | Task | 상태 |
|----|------|------|
| D-01 | `Conversation.contextCouponOrderId` | ✅ |
| D-02 | paid → conversation | ✅ |
| D-03 | 시스템 메시지 | ✅ |
| D-04 | 쿠폰함 → 업소 대화 링크 | ✅ |
| D-05 | Partner 쿠폰 문의 UI | ✅ |
| D-06 | coupon → Hokei event webhook | ✅ |

---

## Phase E — 현지 직원

| ID | Task | 상태 |
|----|------|------|
| E-01 | AgencyStaff / staff allowlist | ✅ |
| E-02 | cashier / scanner / manager | ✅ |
| E-03 | CouponAuditLog | ✅ |
| E-04 | action별 staffId | ✅ |
| E-05 | `/coupon/close-day` | ✅ |
| E-06 | manager만 수수료 금액 | ✅ |

---

## Phase F — 프로덕션

| ID | Task | 상태 |
|----|------|------|
| F-01 | `ALLOW_DEMO_BUYER=false` · secrets | ☐ |
| F-02 | coupon API prod | ☐ |
| F-03 | 제휴서·약관 | ☐ |
| F-04 | TMĐT / Zalo | ☐ |
| F-05 | 수수료 송금 SOP | ☐ |

---

## DB 마이그레이션 (Phase B 이후)

coupon-pilot에서 `paymentMethod` 컬럼 추가 후:

```bash
cd ~/Desktop/호케이-coupon/coupon-pilot
pnpm exec prisma db push --schema=prisma/schema.prisma
pnpm exec prisma generate --schema=prisma/schema.prisma
```

## 프로덕션 체크리스트

- [ ] `ALLOW_DEMO_BUYER=false` (coupon API)
- [ ] `COUPON_INTERNAL_SECRET` / `VIETQR_WEBHOOK_SECRET` 강한 랜덤값
- [ ] `PartnerStore.ownerId` ← 2D SKETCH CAFE 사장님 호케이 userId
- [ ] coupon API 별도 Postgres (`cafe_o2o`)
- [ ] VietQR 웹훅 URL → `https://api.../webhooks/payment/vietqr`

환경 변수: [INTEGRATION.md](./INTEGRATION.md)

## 호케이 변경 파일 (요약)

- `src/lib/coupon/*`
- `src/app/store/[slug]/coupon/*`
- `src/app/account/partner/coupon/*`
- `src/app/api/coupon/[...path]`
- `src/app/admin/coupon`
- `coupon-pilot/apps/api` (gitignore)
