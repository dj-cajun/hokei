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

## Phase 3 — 셀프 서비스

- [x] **T8** 사장님 로그인·본인 LP 수정 (`/account/partner`, `ownerId`)
- [x] **T9** 업체 LP 전체 편집 폼 — admin 7섹션 + HOME_TOP 통합 + owner 동기화

> **결제:** PG·자동 결제 **범위 외** — 영업·수금은 `ads@hokei.vn` 수동 계약·이체

---

## Phase 4 — 프로덕션·운영

- [x] **T10** 신규 업소 등록 시 HOME_TOP 통합 (T9 후속)
- [x] **T11** 프로덕션 데모 시드 + check:prod 확장 + 운영 문서

## Phase 5 — 확장·SEO

- [x] **T12** `/partners` 카테고리 필터 (`?category=`)
- [x] **T13** LP `LocalBusiness` JSON-LD
- [x] **T14** commentPostId — admin 홍보글 `storeName` 검색 UI (스키마 변경 없음)

## Phase 6 — 최적화·품질

- [x] **T15-1** 홈 LCP·배너 쿼리 병렬화 + `fetchPriority`
- [x] **T15-2** check:prod 강화 (2d-sketch, 배너 assert, exit 1)
- [x] **T15-3** BANNER_CLICK 쿠키 dedup
- [x] **T15-4** partner queries·events·배너 view 테스트
- [x] **T15-5** upload-client 공통화 + promo 필드 분리 + 배너 모바일 업로드

## Phase 7 — SNS·에셋 가이드

- [x] **T16-1** admin·배너 폼 이미지 사이즈 가이드 (`PARTNER_ASSET_GUIDE`, `PartnerAssetGuideBox`)
- [x] **T16-2** `PartnerStore.ogImageUrl` — DB·admin 입력·LP `generateMetadata` OG/Twitter (썸네일 fallback)

---

## Phase 8 — Phase C (성능·캐시)

- [x] **C1** 배너 `next/image` + `priority` (HOME_TOP·슬롯)
- [x] **C2** `getPartnerStoreBySlugCached` — LP metadata/page dedup
- [x] **C3** `revalidatePartnerPublicPaths` — admin·owner·배너 API 통일
- [x] **C4** 데스크톱 홈 `HOME_BOTTOM` 배너 노출

---

## 현재 다음 작업

**→ 영업 데모 3분 리허설 (홈 배너 → LP → CTA → admin 통계) · 2번째 파일럿 업소 검토**

---

## Phase 9 — 영업·운영 (수동)

- [ ] **D1** 데모 3분 스크립트 리허설 (`/`, `/store/2d-sketch-cafe`, `/admin/partners`)
- [ ] **D2** OG·HOME_TOP·모바일 배너 에셋 최종 확인 (admin 가이드 기준)
- [ ] **D3** 2번째 파일럿 업소 1곳 등록 (실제 영업 후보)

---

## 완료 로그

| 날짜 | 태스크 | 커밋 |
|------|--------|------|
| 2026-06-28 | Phase C (C1~C4) · prod 시드 | 34f1cf5 |
| 2026-06-28 | IDP 생활 가이드 | be31165 |
| 2026-06-28 | curate 본문+바로가기 | 7c5682d |
| 2026-06-27 | Phase 7 OG·에셋 가이드 | 2c78577 |
| 2026-06-27 | T12~T14 필터·SEO·Post 연동 | 0a84a20 |
| 2026-06-27 | T9 LP 전체 편집 폼 | 35e899d |
| 2026-06-21 | Phase 3 T8 셀프 LP 수정 | 7d233d9 |
| 2026-06-21 | Phase 2 T7 운영·수익 | 637c3d7 |
| 2026-06-27 | Phase 1 MVP T4-2~T6 완료 | 12679c2 |
| 2026-06-27 | T4-1 admin API | a5284ce |
| 2026-06-27 | T3-1~2 /partners 허브 | 1417af3 |
| 2026-06-27 | T2 모바일 LP | 6e9e14e |
| 2026-06-27 | 기획 문서·loop.md | 11665df |
