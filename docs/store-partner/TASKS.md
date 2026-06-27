# Tasks — 업소 제휴 · 배너 · 모바일 LP

> AI는 **한 번에 1개 태스크**만 진행. 완료 시 `[x]` 표시 + `loop.md` 통과.

---

## Phase 1 — MVP (영업 데모 가능)

### T1. 스키마 · lib 기반
- [x] **T1-1** Prisma `PartnerStore`, enums 추가 + `db:pg:patch`
- [x] **T1-2** `src/lib/partner/slug.ts`, `validate.ts` + unit test
- [x] **T1-3** `src/lib/partner/queries.ts` — getBySlug, listPublished

### T2. 모바일 LP
- [x] **T2-1** `src/app/store/[slug]/page.tsx` + `generateMetadata`
- [x] **T2-2** `store-landing.tsx`, `store-cta-bar.tsx`
- [x] **T2-3** 404 / expired / draft 처리

### T3. 제휴 허브
- [x] **T3-1** `src/app/partners/page.tsx`
- [x] **T3-2** `partner-card.tsx` + ads CTA

### T4. 관리자
- [ ] **T4-1** `/api/admin/partners` CRUD + requireAdmin
- [ ] **T4-2** `/admin/partners` + `partners-panel.tsx`
- [ ] **T4-3** 썸네일 — 기존 Blob upload API 재사용

### T5. 홈 배너
- [ ] **T5-1** Prisma `PartnerBanner` + slot enum
- [ ] **T5-2** `/api/admin/partner-banners` CRUD
- [ ] **T5-3** `home-partner-banner.tsx` → `home-page-content.tsx` 삽입

### T6. 시드 · QA
- [ ] **T6-1** `scripts/seed-partner-demo.ts` — 데모 업소 1곳
- [ ] **T6-2** route test 1개 + `npm run check:prod` on www.hokei.vn
- [ ] **T6-3** `docs/BACKLOG.md` 업데이트

---

## Phase 2 — 운영·수익

- [ ] **T7** PartnerEvent 클릭 통계
- [ ] **T7** 추가 배너 슬롯 (HOME_TOP, NEWS_INLINE)
- [ ] **T7** `/promo/timeline` ↔ `/store` 연결
- [ ] **T7** sitemap 동적 URL
- [ ] **T7** admin preview (draft LP)

---

## Phase 3 — 셀프 서비스 (보류)

- [ ] 사장님 로그인·본인 LP 수정
- [ ] PG 결제

---

## 현재 다음 작업

**→ T4-1** (`loop.md` 필수 통과)

---

## 완료 로그

| 날짜 | 태스크 | 커밋 |
|------|--------|------|
| 2026-06-27 | T3-1~2 /partners 허브 | 1417af3 |
| 2026-06-27 | T2 모바일 LP | 6e9e14e |
| 2026-06-27 | 기획 문서·loop.md | 11665df |
