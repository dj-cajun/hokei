# TRD — 업소 제휴 · 배너 · 모바일 LP

**스택:** 기존 호케이 스택 유지 (Next.js 16 App Router, Prisma 7, Neon PG, Vercel)

---

## 1. 아키텍처 개요

```
[Public]
  /partners          → PartnerStore 목록 (published)
  /store/[slug]      → PartnerStore LP (mobile-first)
  HomeBannerSlot     → PartnerBanner (active, date-valid)

[Admin]
  /admin/partners    → CRUD UI
  /api/admin/partners → REST (requireAdmin)

[Data]
  PartnerStore, PartnerBanner (new tables)
```

---

## 2. 라우팅

| Route | 렌더 | 캐시 |
|-------|------|------|
| `src/app/partners/page.tsx` | SSR | `revalidate=300` |
| `src/app/store/[slug]/page.tsx` | SSR | `revalidate=60` |
| `src/app/admin/partners/page.tsx` | SSR + client form | dynamic |

---

## 3. API

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/admin/partners` | ADMIN |
| POST | `/api/admin/partners` | ADMIN |
| PATCH | `/api/admin/partners/[id]` | ADMIN |
| DELETE | `/api/admin/partners/[id]` | ADMIN |
| GET | `/api/admin/partner-banners` | ADMIN |
| POST/PATCH | `/api/admin/partner-banners/...` | ADMIN |

공개 API 불필요 — LP는 Server Component에서 Prisma 직접 조회.

---

## 4. lib 구조

```
src/lib/partner/
  slug.ts           — slugify, unique check
  queries.ts        — getStoreBySlug, listPublished, listBannersForSlot
  validate.ts       — Zod schemas (kakao, phone, maps URL)
  types.ts
```

기존 재사용:

- `@/lib/moderation` — (Partner는 별도 status, Post와 분리)
- `@/lib/admin/require-admin-api`
- `@/lib/contact-emails` — ads@ CTA

---

## 5. UI 컴포넌트

```
src/components/partner/
  store-landing.tsx      — LP 본문 (client CTA tracking optional)
  store-cta-bar.tsx      — sticky 카톡·전화·지도
  partner-card.tsx       — /partners 목록 카드
  home-partner-banner.tsx — 홈 슬롯
src/components/admin/
  partners-panel.tsx     — admin CRUD
```

---

## 6. 배너 슬롯

```ts
enum PartnerBannerSlot {
  HOME_BOTTOM   // Phase 1
  HOME_TOP      // Phase 2
  NEWS_INLINE   // Phase 2
  PROMO_TOP     // Phase 2
}
```

`PartnerBanner`: `storeId`, `slot`, `imageUrl`, `sortOrder`, `startsAt`, `endsAt`, `isActive`

---

## 7. 이미지

- 썸네일: Vercel Blob (`BLOB_READ_WRITE_TOKEN`) — 기존 upload API 패턴
- 배너 이미지: Blob URL 또는 외부 HTTPS URL (관리자 입력)

---

## 8. SEO

- LP: `generateMetadata` — title `{storeName} | 호케이`
- `canonical`: `https://www.hokei.vn/store/{slug}`
- `sitemap.ts`에 published store URL 동적 추가 (Phase 1b)

---

## 9. 보안

- Admin API: session role ADMIN
- Public: published + not expired only
- XSS: 본문은 markdown 제한 또는 plain text
- Open redirect: maps/kakao URL allowlist 검증

---

## 10. 테스트

| 대상 | 종류 |
|------|------|
| `validate.ts`, `slug.ts` | vitest unit |
| `/api/admin/partners` POST | route test (mock prisma) |
| E2E | `/store/demo` smoke (Phase 1b) |

---

## 11. 배포

- Prisma: `db:pg:patch` 또는 migrate
- env 추가 없음 (Phase 1)
- `docs/DEPLOY.md` 절차 따름
