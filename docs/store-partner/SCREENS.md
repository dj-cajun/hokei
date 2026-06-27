# Screens — 업소 제휴 · 배너 · 모바일 LP

---

## 공개 화면

### S1. `/store/[slug]` — 가게 모바일 LP ★핵심

| 영역 | 요소 |
|------|------|
| Header | 가게명, 카테고리 뱃지 |
| Hero | 썸네일 full-width |
| Tagline | 한 줄 카피 |
| CTA Bar (sticky) | 카톡 · 전화 · 길찾기 |
| Body | description, hoursText, address |
| Footer | 「호케이 제휴 업소」+ /partners |

**Layout:** `max-w-[480px]` 중앙, 모바일 퍼스트

---

### S2. `/partners` — 제휴 업소 허브

| 영역 | 요소 |
|------|------|
| Title | 「호케이 제휴 업소」 |
| Grid | PartnerCard (썸네일, name, tagline, category) |
| CTA | 「광고·제휴 문의」→ `/contact?kind=ads` |
| Empty | 「준비 중」+ ads CTA |

---

### S3. 홈 — 배너 슬롯 (기존 홈 수정)

| Slot | 위치 | 컴포넌트 |
|------|------|----------|
| HOME_BOTTOM | PopularPostsStrip 아래 또는 AdSense 위 | `HomePartnerBanner` |

클릭 → `/store/[slug]`

---

### S4. 기존 `/promo` (변경 최소)

- Phase 1: footer에 「제휴 업소 보기 → /partners」링크만
- Phase 2: promo 상단 배너 슬롯

---

## 관리자 화면

### A1. `/admin/partners`

| 탭 | 기능 |
|----|------|
| 업소 목록 | table: name, slug, plan, status, expires |
| 등록/수정 | modal or subpage form |
| 배너 | slot별 imageUrl, active, 기간 |

Form fields = DB-DESIGN PartnerStore + PartnerBanner

---

## URL 규칙

| URL | 금지 |
|-----|------|
| `/store/saigon-bbq` | slug: lowercase, hyphen, 2~48자 |
| `/partners` | |
| `/admin/partners` | 비로그인 → login |

**Redirect:** 없음 (Phase 1)

---

## 와이어 (LP 텍스트)

```
┌─────────────────────────┐
│  [ Hero Image ]         │
│  막둥이네 짬뽕           │
│  1군 · 한식              │
├─────────────────────────┤
│ [카톡] [전화] [길찾기]   │  ← sticky
├─────────────────────────┤
│  설명 텍스트…            │
│  🕐 10:00–22:00         │
│  📍 123 Nguyễn Huệ…     │
└─────────────────────────┘
```

---

## sitemap / SEO

Phase 1b: `sitemap.ts`에 `PartnerStore` published slug 추가
