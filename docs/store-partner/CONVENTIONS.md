# Coding Conventions — store-partner

> 프로젝트 공통 규칙 + 본 기능 전용 규칙. 충돌 시 **본 문서 → 기존 코드 패턴** 순.

---

## 1. 공통 (호케이)

- Next.js App Router, Server Component 우선
- API: `{ ok: true, ... }` / `{ ok: false, error }` (`apiSuccess` / `apiError`)
- 입력 검증: Zod
- Admin: `requireAdminApi` / layout `requireAdmin`
- DB: Prisma proxy, `mergeVisiblePostWhere`는 **Post 전용** — Partner는 별도 status
- 테스트: vitest, `src/__tests__/` 또는 `*.test.ts` colocated
- 커밋: 사용자 요청 시만, 한국어 메시지

---

## 2. 네이밍

| 대상 | 규칙 | 예 |
|------|------|-----|
| Prisma model | PascalCase | `PartnerStore` |
| slug | kebab-case, ASCII | `saigon-bbq` |
| lib folder | `src/lib/partner/` | |
| components | `src/components/partner/` | |
| admin panel | `partners-panel.tsx` | |
| API route | `/api/admin/partners` | RESTful |

---

## 3. Partner 전용

### slug

- `slugify(name)` — 기존 `slugifyStoreName` 패턴 재사용 또는 통합
- unique 충돌 시 `-2`, `-3` suffix

### URL 검증

```ts
// kakaoLink — 기존 isValidKakaoLink
// mapsUrl — https://maps.google.com or https://goo.gl/maps
// phone — optional, tel: link safe chars
```

### 공개 조회 where

```ts
const publishedPartnerWhere = {
  status: "PUBLISHED",
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
};
```

---

## 4. UI

- LP: Tailwind, `max-w-[480px] mx-auto` on mobile; lg에서도 readable width
- CTA 버튼: `min-h-11`, primary 카톡 / secondary 전화
- 이미지: `next/image` or existing thumbnail component
- 한국어 UI copy, 업소명은 원문 유지

---

## 5. 금지

- Partner 데이터를 `Post` 테이블에 hack하지 않기 (Phase 1)
- `mailto:` only CTA — 카톡·tel·maps deep link 사용
- admin 없이 public create API
- scope 밖 리팩터 (posts.ts 639줄 분리 등) — 별도 태스크

---

## 6. 문서 동기화

코드 변경 시 업데이트:

- 스키마 변경 → `DB-DESIGN.md`
- URL 추가 → `SCREENS.md`
- 범위 변경 → `PRD.md` + `TASKS.md`

---

## 7. loop.md 연동

태스크 완료 보고 형식:

```
✅ T2-1 완료
- lint/test/build: pass
- 자가 평가: UX 4/5 — CTA sticky 확인
- 다음: T2-2
```
