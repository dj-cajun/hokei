# O2O 쿠폰 × 호케이 통합

2D SKETCH CAFE부터 시작하는 **호케이 LP + 쿠폰 API + 대리점 스캔** 통합 기획.

| 문서 | 내용 |
|------|------|
| [WORKSPACE.md](./WORKSPACE.md) | **폴더·브랜치 SSOT** |
| [ROADMAP.md](./ROADMAP.md) | 전체 로드맵 (Phase A~G) |
| [PRD.md](./PRD.md) | 제품 요구사항 |
| [INTEGRATION.md](./INTEGRATION.md) | 호케이 라우트·API·인증 |
| [TASKS.md](./TASKS.md) | 개발 Task |

**개발 폴더:** `~/Desktop/호케이-coupon` (`feat/coupon-o2o`)  
**백엔드:** `coupon-pilot/` (gitignore, NestJS API `:3020`)

## 로컬 실행

```bash
# 터미널 1 — 호케이 (쿠폰 UI 포함)
cd ~/Desktop/호케이-coupon
npm run dev                    # :3001

# 터미널 2 — 쿠폰 API
cd ~/Desktop/호케이-coupon/coupon-pilot
pnpm --filter @cafe/api dev    # :3020
```

## URL (통합 후)
