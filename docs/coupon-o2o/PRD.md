# PRD — 호케이 O2O 쿠폰 (2D SKETCH CAFE)

## 목표

[호케이 업소 LP](https://www.hokei.vn/store/2d-sketch-cafe)에서 **커피 쿠폰 구매 → 쿠폰함 → 매장 QR 사용**까지 한 흐름으로 제공.  
(호케이 **쪽지함** `/messages` 는 1:1 DM — 쿠폰 보관은 **쿠폰함** `/coupon/wallet`)
대리점(사장님) **QR 스캔·정산**은 호케이 `/account/partner/coupon/*` 에 통합.

## MVP 범위

| ID | 요구사항 |
|----|----------|
| H-01 | `/store/2d-sketch-cafe` 에 쿠폰 구매 CTA |
| H-02 | `/store/[slug]/coupon` 메뉴·구매 (slug 화이트리스트) |
| H-03 | `/store/[slug]/coupon/wallet` 쿠폰함 + 3분 QR |
| H-04 | 호케이 로그인 유저 → 쿠폰 API User 매핑 |
| H-05 | `/account/partner/coupon/scan` 웹 QR 스캐너 |
| H-06 | `/account/partner/coupon/dashboard` 주간 매출·정산 예정 |
| H-07 | 수동 입금 승인 — `/admin/coupon` (호케이 ADMIN) |

## Out of Scope (v1)

- VietQR 자동 입금
- Agency JWT ↔ NextAuth 완전 SSO (v1은 Agency login 별도)
- coupon-pilot Buyer/Agency 앱 (:3021/:3022) — 호케이로 대체

## 성공 지표

- LP → 쿠폰 구매 → QR 스캔 E2E 로컬 성공
- 호케이 본 DB 스키마 변경 없음 (쿠폰 DB 분리 유지)
