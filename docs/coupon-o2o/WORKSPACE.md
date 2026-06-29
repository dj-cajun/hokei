# WORKSPACE — 개발 폴더 SSOT

> **기억할 것:** O2O 쿠폰 작업은 **`호케이-coupon`** 폴더에서만 한다.  
> 일반 호케이(프로덕션 동일)는 **`호케이`** 폴더.

## 폴더·브랜치

| 경로 | Git 브랜치 | 용도 |
|------|------------|------|
| `~/Desktop/호케이-coupon` | `feat/coupon-o2o` | O2O 쿠폰 (호케이 UI + 문서) |
| `~/Desktop/호케이-coupon/coupon-pilot` | *(gitignore)* | NestJS API `:3020` · DB `cafe_o2o` |
| `~/Desktop/호케이` | `main` | 커뮤니티 포털 only (쿠폰 없음) |

동일 remote (`dj-cajun/hokei`), **git worktree** 로 폴더 분리.

```bash
git worktree list
# 호케이-coupon  → feat/coupon-o2o
# 호케이         → main
```

## 로컬 실행 (쿠폰)

터미널 1 — API:

```bash
cd ~/Desktop/호케이-coupon/coupon-pilot
pnpm install
pnpm exec prisma db push --schema=prisma/schema.prisma
pnpm --filter @cafe/api dev    # :3020
```

터미널 2 — 호케이 (쿠폰 UI):

```bash
cd ~/Desktop/호케이-coupon
npm install
npm run dev                    # :3001
```

`.env.local` (호케이-coupon):

```bash
NEXT_PUBLIC_COUPON_API_URL=http://localhost:3020
NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe
COUPON_INTERNAL_SECRET=dev-coupon-internal-secret
```

## 진행 상황 (2026-06)

| Phase | 상태 |
|-------|------|
| Baseline I + A (일부) + B + C + D | ✅ |
| **E 현지 직원·마감** | ✅ |
| **F 프로덕션 준비** | ✅ (배포·env는 인간 실행) |
| G 확장 | ☐ |
| G 확장 | ☐ |

상세: [TASKS.md](./TASKS.md) · [ROADMAP.md](./ROADMAP.md)

## 머지 전략

1. `feat/coupon-o2o` 에서 QA 완료
2. `git push -u origin feat/coupon-o2o` → Vercel Preview
3. 리뷰 후 `main` PR 머지
4. coupon-pilot 별도 배포 + prod env

**`main`에 쿠폰 없이 작업:** `~/Desktop/호케이` 만 사용.
