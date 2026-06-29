# 업소 온보딩 — O2O 쿠폰 추가

> Phase G-01 SSOT. 코드 변경 후 coupon-pilot seed + 호케이 env.

## 1. 호케이 PartnerStore

1. `/admin` 또는 시드로 `PartnerStore` 생성 (`slug` 확정)
2. 사장님 계정에 owner 부여:

```bash
STORE_SLUG=my-cafe OWNER_EMAIL=owner@example.com npm run coupon:grant-owner
```

## 2. 호케이 `src/lib/coupon/config.ts`

`BASE_REGISTRY`에 한 줄 추가:

```ts
{ slug: "my-cafe", agencyLoginId: "my_cafe", label: "My Cafe" },
```

또는 env만 (재배포 없이 매핑만):

```env
NEXT_PUBLIC_COUPON_STORE_MAP=my-cafe:my_cafe:My Cafe
```

## 3. 활성화 whitelist

```env
NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe,my-cafe
```

점진 롤아웃: 신규 slug만 추가.

## 4. coupon-pilot (로컬 API)

`prisma/seed.ts`에 `Agency` + `Product` upsert. `loginId` = 위 `agencyLoginId`.

```bash
cd coupon-pilot
pnpm exec prisma db push --schema=prisma/schema.prisma
pnpm exec tsx prisma/seed.ts
```

## 5. 검증

| 항목 | 확인 |
|------|------|
| Buyer | `/store/{slug}/coupon` 메뉴 노출 |
| Partner SSO | 업소 owner 로그인 → `/account/partner/coupon` |
| 스캔 | QR 교환 · 수수료 집계 |

## 데모 두 번째 업소

- slug: `demo-cafe` → agency `other_cafe` (seed 포함, 기본 env 비활성)
- 로컬 테스트: `NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe,demo-cafe`
