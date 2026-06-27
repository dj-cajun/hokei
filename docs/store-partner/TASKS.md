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
- [x] **T4-1** `/api/admin/partners` CRUD + requireAdmin
- [x] **T4-2** `/admin/partners` + `partners-panel.tsx`
- [x] **T4-3** 썸네일 — 기존 Blob upload API 재사용

### T5. 홈 배너
- [x] **T5-1** Prisma `PartnerBanner` + slot enum
- [x] **T5-2** `/api/admin/partner-banners` CRUD
- [x] **T5-3** `home-partner-banner.tsx` → `home-page-content.tsx` 삽입

### T6. 시드 · QA
- [x] **T6-1** `scripts/seed-partner-demo.ts` — 데모 업소 1곳
- [x] **T6-2** route test 1개 + `npm run check:prod` on www.hokei.vn
- [x] **T6-3** `docs/BACKLOG.md` 업데이트

---

## Phase 2 — 운영·수익

- [x] **T7** PartnerEvent 클릭 통계
- [x] **T7** 추가 배너 슬롯 (HOME_TOP, NEWS_INLINE)
- [x] **T7** `/promo/timeline` ↔ `/store` 연결
- [x] **T7** sitemap 동적 URL
- [x] **T7** admin preview (draft LP)

---

## Phase 3 — 셀프 서비스 (보류)

- [ ] 사장님 로그인·본인 LP 수정
- [ ] PG 결제

---

## 현재 다음 작업

**→ Phase 3 (셀프 서비스)** 또는 프로덕션 운영·데모 시드

---

## 완료 로그

| 날짜 | 태스크 | 커밋 |
|------|--------|------|
| 2026-06-21 | Phase 2 T7 운영·수익 | 637c3d7 |
| 2026-06-27 | Phase 1 MVP T4-2~T6 완료 | 12679c2 |
| 2026-06-27 | T4-1 admin API | a5284ce |
| 2026-06-27 | T3-1~2 /partners 허브 | 1417af3 |
| 2026-06-27 | T2 모바일 LP | 6e9e14e |
| 2026-06-27 | 기획 문서·loop.md | 11665df |
