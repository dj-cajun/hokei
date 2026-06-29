# OPERATIONS — O2O 쿠폰 운영 SOP

## 일일 (카페 현지)

1. 직원 **PIN 로그인** (scanner/cashier)
2. QR 스캔 · 현금 수령 → 시스템 자동 기록 (`CouponAuditLog`)
3. **매니저** 일 마감: Partner → **일 마감** (`/account/partner/coupon/close-day`)
4. 마감 숫자와 실제 교환 건 대조

## 주간 (수수료 — K BROTHERS)

| 단계 | 담당 | 내용 |
|------|------|------|
| 1 | 시스템 | Partner 대시보드 · Admin 주간 리포트 — 교환 N건 × `commissionFixed` |
| 2 | 카페 매니저 | 호케이 리포트와 내부 장부 대조 |
| 3 | 카페 → K BROTHERS | **월~일 수수료 합계** 법인 계좌 송금 (직접 정산) |
| 4 | K BROTHERS | 수수료 **Hóa đơn** 발행 (VSIC 6219·6310) |

**SSOT 숫자**

| 항목 | 출처 |
|------|------|
| 교환 건수 | `CouponAuditLog.redeemed` 또는 Transaction count |
| 수수료 | `redeemed × Agency.commissionFixed` |
| 손님 결제금 | 카페 직수금 (QR/현금) — 플랫폼 미경유 |

## Admin (호케이)

- **입금 승인** `/admin/coupon` — bank_qr 수동 확인
- **주간 수수료** — 동일 페이지 하단 리포트

## 장애 대응

| 증상 | 조치 |
|------|------|
| 스캔 실패 TOKEN_EXPIRED | 손님 쿠폰함에서 QR 재발급 |
| VietQR 미매칭 | Admin 수동 승인 또는 입금자명·금액 확인 |
| API down | `GET /health` · 호케이는 쿠폰 구매만 실패, 커뮤니티는 정상 |
| 대화 미생성 | `PartnerStore.ownerId` 설정 확인 |

## 연락

- 기술: K BROTHERS (coupon API · 호케이)
- 카페 현장: 2D SKETCH CAFE 매니저
