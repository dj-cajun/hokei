# ROADMAP — 호케이 O2O 쿠폰

> **SSOT:** 호케이에서 쿠폰 구매 → 업소 QR 송금 또는 매장 현금 → 쿠폰함 + (향후) 업소 채팅 → QR 교환 시 플랫폼 수수료 1건 → 주간 정산

관련: [PRD.md](./PRD.md) · [INTEGRATION.md](./INTEGRATION.md) · [TASKS.md](./TASKS.md) · [WORKSPACE.md](./WORKSPACE.md)

**개발 폴더:** `~/Desktop/호케이-coupon` · 브랜치 `feat/coupon-o2o`

---

## 1. 역할

| 주체 | 역할 |
|------|------|
| 구매자 | 호케이 로그인 · 구매 · 쿠폰함 · QR |
| 업소 (2D SKETCH CAFE) | 입금 QR/현금 · 스캔 · 현지 직원 · 일 마감 |
| 호케이 / K BROTHERS | 플랫폼 · 교환 시 수수료 · Admin |
| (선택) 로컬 TNHH | Zalo·TMĐT·B2C 표면 (K BROTHERS 지분 0%) |

---

## 2. 돈·수수료

```
[구매]  손님 → 카페 계좌 QR / 매장 현금
[교환]  스캔 1건 → platformFee 1건 (우리 카운트)
[정산]  주 1회 카페 → K BROTHERS 수수료 송금
```

---

## 3. Baseline ✅ (I-01 ~ I-15)

- Buyer `/store/[slug]/coupon/*`
- Partner `/account/partner/coupon/*`
- Admin `/admin/coupon`
- coupon-pilot API `:3020` · DB `cafe_o2o` 분리
- VietQR webhook · Partner SSO

---

## 4. Phase 로드맵

### Phase A — 정합성·운영 준비

| ID | Task |
|----|------|
| A-01 | UI: **쿠폰함** (DM `/messages` 쪽지함과 구분) |
| A-02 | ROADMAP · TASKS SSOT |
| A-03 | `PartnerStore.ownerId` ↔ 사장님 |
| A-04 | checkout: 입금 계좌 = **업소(대리점)** 명시 |
| A-05 | 프로덕션 checklist |

### Phase B — 결제 2트랙

| ID | Task |
|----|------|
| B-01 | checkout **계좌 QR \| 매장 현금** 선택 |
| B-02 | Order `paymentMethod` |
| B-03 | Partner **현금 수령·발급** |
| B-04 | `/account/partner/coupon/orders` |
| B-05 | VietQR **bank_qr 주문만** |

### Phase C — 플랫폼 수수료

| ID | Task |
|----|------|
| C-01 | `Agency.commissionFixed` |
| C-02 | 스캔 시 `platformFee` |
| C-03 | Partner: 교환 N건 · 납부 예정 수수료 |
| C-04 | Admin 주간 수수료 리포트 |
| C-05 | Transaction 의미 정리 |

### Phase D — 채팅 (호케이 `/messages`)

| ID | Task |
|----|------|
| D-01 | `Conversation.contextCouponOrderId` |
| D-02 | `paid` → conversation 자동 생성 |
| D-03 | 시스템 메시지 템플릿 |
| D-04 | 쿠폰함 「업소와 대화」 |
| D-05 | Partner 미읽음/주문 링크 |
| D-06 | coupon → Hokei internal event (선택) |

### Phase E — 현지 직원·카운트

| ID | Task |
|----|------|
| E-01 | AgencyStaff 또는 Hokei staff allowlist |
| E-02 | role: cashier / scanner / manager |
| E-03 | CouponAuditLog |
| E-04 | Partner action에 staffId |
| E-05 | `/coupon/close-day` 일 마감 |
| E-06 | manager만 수수료 금액 |

### Phase F — 프로덕션·법무

| ID | Task |
|----|------|
| F-01 | secrets · `ALLOW_DEMO_BUYER=false` |
| F-02 | coupon API prod 배포 |
| F-03 | 제휴서 · 약관 |
| F-04 | TMĐT / Zalo Verify |
| F-05 | 수수료 송금 SOP |

### Phase G — 확장 (v2)

업소 추가 · 로컬 TNHH 계약 · Zalo 미니앱 · POS 연동

---

## 5. 실행 순서

```
I ✅ → A → B ✅ → C ✅ → D ✅ → E ✅ → F → G
```

일반 호케이(`~/Desktop/호케이` main)와 **폴더 분리** — [WORKSPACE.md](./WORKSPACE.md)

---

## 6. URL SSOT

| 역할 | URL |
|------|-----|
| 구매 | `/store/2d-sketch-cafe/coupon` |
| 결제 | `.../checkout/[orderId]` |
| 쿠폰함 | `.../coupon/wallet` |
| QR | `.../wallet/[id]/redeem` |
| 채팅 | `/messages/[id]` (D) |
| Partner | `/account/partner/coupon/*` |
| Partner 주문 | `.../coupon/orders` (B) |
| Admin | `/admin/coupon` |

---

## 7. 일 마감 SSOT

| 숫자 | SSOT |
|------|------|
| 교환 건수 | AuditLog `redeemed` |
| 수수료 | redeemed × 단가 |
| 현금 확인 | AuditLog `cash_confirmed` |

---

## 8. 미결정

1. 수수료: **건당 ₫** vs **%** (권장: 건당)
2. 직원: **PIN** (파일럿) vs 호케이 개인 계정
3. 채팅: paid 즉시 vs 첫 메시지 시 (권장: paid 즉시)
