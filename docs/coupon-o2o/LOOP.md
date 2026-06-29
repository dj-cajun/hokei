# LOOP — O2O 쿠폰 AI 작업 루프

> 폴더: `~/Desktop/호케이-coupon` · SSOT: `docs/coupon-o2o/TASKS.md`

## 0. 시작

1. [WORKSPACE.md](./WORKSPACE.md) — 올바른 폴더·브랜치 확인
2. [TASKS.md](./TASKS.md) — **다음 미완료 1개** 선택
3. 관련: PRD · INTEGRATION · ROADMAP

## 1. Pass/Fail (완료 전)

| # | 기준 | 명령 |
|---|------|------|
| 1 | coupon API test | `cd coupon-pilot && pnpm --filter @cafe/api test` |
| 2 | 호케이 unit test | `npm test` (쿠폰 관련) |
| 3 | env (prod 준비 시) | `npm run coupon:check-env` |
| 4 | 비밀 노출 없음 | diff에 `.env` 실값 없음 |
| 5 | TASKS 범위 | 해당 Phase ID만 |

## 2. 완료 보고 형식

```
Phase X — {ID} 완료
- 변경: (파일 요약)
- 다음: TASKS.md 다음 ☐
```

## 3. 인간 확인 없이 진행 (이 프로젝트)

- coupon-pilot 코드·문서 (gitignore API는 로컬 유지)
- `feat/coupon-o2o` 커밋
- 시드·스키마 push (로컬 dev DB)
- 문서·스크립트·Dockerfile

## 4. 인간 확인 필요

- `main` 머지 · Vercel production env
- Neon **production** 스키마
- 실계좌·VietQR·법인 계약서 서명
- `vercel env` / Railway secrets 실제 등록

## 5. Phase 순서

`I ✅ → A ✅ → B ✅ → C ✅ → D ✅ → E ✅ → F ✅ → G`

