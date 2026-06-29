# O2O 쿠폰 × 호케이 통합

2D SKETCH CAFE부터 시작하는 **호케이 LP + 쿠폰 API + 대리점 스캔** 통합 기획.

| 문서 | 내용 |
|------|------|
| [ROADMAP.md](./ROADMAP.md) | **전체 로드맵** (Phase A~G) |
| [PRD.md](./PRD.md) | 제품 요구사항 |
| [INTEGRATION.md](./INTEGRATION.md) | 호케이 라우트·API·인증 |
| [TASKS.md](./TASKS.md) | 개발 Task |

**백엔드:** `coupon-pilot/` (gitignore, NestJS API `:3020`)  
**프론트:** 호케이 `src/app` (Buyer·Agency UI 통합)

## 로컬 실행

```bash
# 터미널 1 — 호케이 (Buyer + Agency UI)
cd ~/Desktop/호케이
npm run dev                    # :3001

# 터미널 2 — 쿠폰 API
cd ~/Desktop/호케이/coupon-pilot
pnpm dev                       # API :3020 only — turbo에서 buyer/agency 제외 가능
```

또는 API만: `cd coupon-pilot/apps/api && pnpm dev`

## URL (통합 후)

| 역할 | URL |
|------|-----|
| 업소 LP | `/store/2d-sketch-cafe` |
| 쿠폰 구매 | `/store/2d-sketch-cafe/coupon` |
| 쿠폰함 | `/store/2d-sketch-cafe/coupon/wallet` |
| Partner 주문·현금 | `/account/partner/coupon/orders` |
| 사장님 QR 스캔 | `/account/partner/coupon/scan` (호케이 SSO) |
| 사장님 정산 | `/account/partner/coupon/dashboard` |

## VietQR 테스트 (로컬)

```bash
# 주문 생성 후 transferNote 예: CAFE-5089F1DA
curl -X POST http://localhost:3020/webhooks/payment/vietqr \
  -H "Content-Type: application/json" \
  -H "X-Vietqr-Secret: dev-vietqr-webhook-secret" \
  -d '{"amount":55000,"description":"CAFE-5089F1DA","transactionId":"tx-1"}'
```
