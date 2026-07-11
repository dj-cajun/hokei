# WORKSPACE — 개발 폴더 SSOT

> **기억할 것**
> - **프로덕션 동일·건드리지 않음:** `~/Desktop/호케이` (`main`)
> - **쿠폰 작업·로컬 실험:** **`~/Desktop/호케이2`** ← 이 폴더 (독립 clone)

## 폴더·브랜치

| 경로 | Git | 용도 |
|------|-----|------|
| `~/Desktop/호케이` | `main` · worktree | 프로덕션과 동일. **쿠폰 작업 금지** |
| **`~/Desktop/호케이2`** | `feat/coupon-o2o` · **독립 clone** | **쿠폰 UI + 문서 (여기서만 작업)** |
| `~/Desktop/호케이2/coupon-pilot` | *(gitignore)* | NestJS API `:3020` · DB `cafe_o2o` |
| `~/Desktop/호케이-coupon` | (구 worktree) | 예전 복사본 — **새 작업은 호케이2** |

`호케이2`는 `호케이`를 **복사(clone)** 한 별도 저장소입니다. `main` 폴더와 파일을 섞지 않습니다.

## 로컬 실행 (쿠폰)

터미널 1 — API:

```bash
cd ~/Desktop/호케이2/coupon-pilot
pnpm install
pnpm exec prisma db push --schema=prisma/schema.prisma
pnpm --filter @cafe/api dev    # :3020
```

터미널 2 — 호케이 (쿠폰 UI):

```bash
cd ~/Desktop/호케이2
npm install
npm run dev                    # :3001
```

`.env.local` (호케이2):

```bash
NEXT_PUBLIC_COUPON_API_URL=http://localhost:3020
NEXT_PUBLIC_COUPON_ENABLED_SLUGS=2d-sketch-cafe
COUPON_INTERNAL_SECRET=dev-coupon-internal-secret
```

## 머지 전략

1. `호케이2`에서 `feat/coupon-o2o` QA
2. `git push origin feat/coupon-o2o` → Vercel Preview
3. 리뷰 후 `main` PR 머지 (`호케이` 폴더에서 pull만)
4. coupon-pilot 별도 배포 + prod env

**일반 호케이만 수정할 때:** `~/Desktop/호케이` (`main`) 만 사용.
