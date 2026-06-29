# PRODUCTION-CHECKLIST — O2O 쿠폰

> `~/Desktop/호케이-coupon` · 런칭 전 인간 확인 항목

## A. 호케이 (Vercel)

- [ ] `feat/coupon-o2o` → `main` PR 머지
- [ ] `NEXT_PUBLIC_COUPON_API_URL` = 프로덕션 coupon API URL
- [ ] `NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe` (점진 롤아웃 시 slug만)
- [ ] `COUPON_INTERNAL_SECRET` = API와 **동일** (32자+ 랜덤)
- [ ] Prisma: `contextCouponOrderId` 컬럼 (`prisma db push` on Neon **dev** first, then prod)
- [ ] `PartnerStore.ownerId` = 2D 사장님 호케이 userId → [A-03 스크립트](#a-03-사장님-ownerid)

## B. Coupon API

- [ ] `NODE_ENV=production`
- [ ] `ALLOW_DEMO_BUYER=false`
- [ ] `JWT_SECRET` / `REDEMPTION_SIGNING_SECRET` / `COUPON_INTERNAL_SECRET` / `VIETQR_WEBHOOK_SECRET` — dev 기본값 **금지**
- [ ] `DATABASE_URL` → 전용 Postgres `cafe_o2o`
- [ ] `BUYER_URL=https://www.hokei.vn`
- [ ] `COUPON_CORS_ORIGINS` = hokei.vn 도메인
- [ ] `GET /health` → `db: true`
- [ ] `pnpm exec tsx scripts/check-env.ts` (NODE_ENV=production) 통과

## C. 업소·운영

- [ ] 2D SKETCH CAFE `commissionFixed` 확인 (기본 3,000₫)
- [ ] Agency `bankAccount` / VietQR 실계좌
- [ ] 직원 PIN 배포·교육 (manager/scanner/cashier)
- [ ] 일 마감 SOP 팀 공유 → [OPERATIONS.md](./OPERATIONS.md)
- [ ] 제휴·약관 → [LEGAL.md](./LEGAL.md)

## D. VietQR

- [ ] 웹훅 URL 등록
- [ ] `VIETQR_AUTO_APPROVE` 정책 결정 (권장: true + 웹훅 검증)
- [ ] 입금자명 `CAFE-{orderId 8자}` 규칙 안내

## E. 수수료 정산 (K BROTHERS)

- [ ] 주간 송금 SOP → [OPERATIONS.md](./OPERATIONS.md) § 수수료
- [ ] Hóa đơn 발행 프로세스

---

## A-03 사장님 ownerId

```bash
cd ~/Desktop/호케이-coupon
OWNER_EMAIL=사장님@email.com npm run coupon:grant-2d-owner
```

또는 Admin → 제휴 업소 → owner 이메일 지정 (`2d-sketch-cafe`).

효과: Partner SSO · 결제 후 `/messages` 대화 자동 생성.

## env 점검 명령

```bash
# 호케이
npm run coupon:check-env

# coupon-pilot
cd coupon-pilot && NODE_ENV=production pnpm exec tsx scripts/check-env.ts
```
