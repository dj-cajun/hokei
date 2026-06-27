# DB Design — PartnerStore · PartnerBanner

**Provider:** PostgreSQL (Neon) · Prisma `schema.prisma`

---

## ER 개요

```
PartnerStore 1 ── * PartnerBanner
PartnerStore (optional) ── link ── Post.storeName  [Phase 2, soft string match]
```

---

## PartnerStore

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | PK |
| slug | String @unique | URL `/store/{slug}` |
| name | String | 가게명 (표시) |
| tagline | String? | 한 줄 소개 |
| introText | String? @db.Text | LP 본문 (우선) |
| description | String? | 상세 (레거시) |
| menuText | String? @db.Text | 메뉴·가격 |
| locationTips | String? @db.Text | 오시는 길 팁 |
| category | PartnerCategory | FOOD, BEAUTY, CLINIC, SERVICE, OTHER |
| phone | String? | E.164 or local |
| kakaoLink | String? | pf.kakao / open.kakao |
| mapsUrl | String? | Google Maps share URL |
| address | String? | 주소 텍스트 |
| hoursText | String? | 영업시간·이벤트 (자유 텍스트) |
| commentPostId | String? | LP 하단 댓글 연결 Post ID |
| thumbnail | String? | Blob or HTTPS — LP Hero |
| ogImageUrl | String? | SNS OG (1200×630 권장). 없으면 thumbnail fallback |
| plan | PartnerPlan | BASIC, STANDARD, PREMIUM |
| status | PartnerStatus | DRAFT, PUBLISHED, ARCHIVED |
| sortOrder | Int @default(0) | /partners 정렬 |
| publishedAt | DateTime? | |
| expiresAt | DateTime? | null = 무기한 |
| ownerId | String? | FK → User (셀프 수정 권한) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Indexes:** `slug`, `status`, `category`, `expiresAt`

---

## PartnerBanner

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String @id cuid | |
| storeId | String | FK → PartnerStore |
| slot | PartnerBannerSlot | HOME_BOTTOM, … |
| imageUrl | String | 배너 이미지 (PC) |
| mobileImageUrl | String? | HOME_TOP 모바일 전용 (768px 미만) |
| altText | String? | a11y |
| linkSlug | String? | override slug (default: store.slug) |
| sortOrder | Int @default(0) | |
| isActive | Boolean @default(true) | |
| startsAt | DateTime? | |
| endsAt | DateTime? | |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Indexes:** `slot, isActive`, `storeId`

---

## Enums

```prisma
enum PartnerCategory {
  FOOD
  BEAUTY
  CLINIC
  SERVICE
  OTHER
}

enum PartnerPlan {
  BASIC
  STANDARD
  PREMIUM
}

enum PartnerStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum PartnerBannerSlot {
  HOME_BOTTOM
  HOME_TOP
  NEWS_INLINE
  PROMO_TOP
}
```

---

## Phase 2 — PartnerEvent (클릭 통계)

| 필드 | 타입 |
|------|------|
| id | cuid |
| storeId | FK |
| eventType | VIEW \| KAKAO_CLICK \| PHONE_CLICK \| MAPS_CLICK |
| createdAt | DateTime |
| userAgent hash | optional |

---

## 마이그레이션

1. `prisma/schema.prisma` 추가
2. `npm run db:pg:patch` (Vercel build hook)
3. 시드: `scripts/seed-partner-demo.ts` — 데모 1곳 (Phase 1)

---

## 기존 Post와 관계

- **Phase 1:** `PartnerStore.commentPostId` → Post.id (관리자 수동·홍보글 검색 UI)
- **Phase 2:** `Post.storeName` soft match + admin `storeName` 검색 API
