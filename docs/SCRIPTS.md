# CLI 스크립트 가이드

## 일상

| 명령 | 용도 |
|------|------|
| `npm run dev` | 로컬 SQLite 개발 서버 |
| `npm run news:ingest` | 로컬 DB 뉴스 수집 |
| `npm run db:generate` | Prisma Client 재생성 (SQLite 복구) |

## Neon / 프로덕션 DB

`.env.production.pg`에 `DATABASE_URL=postgresql://...` 필요.

| 명령 | 용도 |
|------|------|
| `npm run news:prod:update` | env 동기화 → Neon 수집 → 썸네일 backfill → SQLite 복구 |
| `npm run news:reset:neon` | Neon 추가 수집 (`-- --full` 일일 상한 무시) |
| `npm run news:check:prod` | 수집·스키마·카테고리 점검 |
| `npm run news:backfill-thumbnails -- --neon --missing-only` | Neon 썸네일 보정 |
| `npm run news:backfill-thumbnails -- --neon --stats` | 썸네일 통계만 |

Neon 스크립트는 `scripts/lib/neon-bootstrap.ts`의 `openNeonPrisma()`만 사용합니다.  
작업 후 로컬 dev가 깨지면 `npm run db:generate`.

## 디버그 · 헬스

| 명령 | 용도 |
|------|------|
| `npm run debug:post -- <id>` | 로컬 `getPostById` |
| `npm run debug:post:neon -- <id>` | Neon raw SQL |
| `npm run debug:post:neon:prisma -- <id>` | Neon Prisma 쿼리 |
| `npm run health:post:prod -- <id>` | 프로덕션 글 상세 API |

## 배포

| 명령 | 용도 |
|------|------|
| `npm run predeploy:prod` | lint · test · build · env |
| `npm run deploy:full` | 점검 후 git push → Vercel |

자세한 env: [DEPLOY.md](./DEPLOY.md) · DB: [DATABASE.md](./DATABASE.md)
