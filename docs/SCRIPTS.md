# CLI 스크립트 가이드

## 일상 (로컬 dev)

| 명령 | 용도 |
|------|------|
| `npm run dev` | Neon dev(`.env`)로 개발 서버 :3001 |
| `npm run setup` / `setup:pg` | Docker PG 초기 설정 (Neon dev 사용 시 `db:seed`만으로도 가능) |
| `npm run db:generate` | Prisma Client 재생성 |
| `npm run db:seed` | 시드 데이터 |
| `npm run search:pg:setup` | tsvector 검색 설정 |
| `npm run news:ingest` | 로컬 `.env` DB 뉴스 수집 |

로컬 DB는 `.env`의 `DATABASE_URL`(Neon **dev** 브랜치)입니다.

## Neon / 프로덕션 DB

`.env.production.pg`에 production Neon `DATABASE_URL` 필요.

| 명령 | 용도 |
|------|------|
| `npm run news:prod:update` | Vercel env 동기화 → production 수집 → 썸네일 backfill → `db:generate` |
| `npm run news:reset:neon` | production 추가 수집 (`-- --full` 일일 상한 무시) |
| `npm run news:check:prod` | 수집·스키마·카테고리 점검 |
| `npm run news:backfill-thumbnails -- --neon --missing-only` | production 썸네일 보정 |
| `npm run news:backfill-thumbnails -- --neon --stats` | 썸네일 통계만 |

Neon 스크립트는 `scripts/lib/neon-bootstrap.ts`의 `openNeonPrisma()`만 사용합니다.

## 디버그 · 헬스

| 명령 | 용도 |
|------|------|
| `npm run debug:post -- <id>` | 로컬 dev DB `getPostById` |
| `npm run debug:post:neon -- <id>` | production Neon raw SQL |
| `npm run debug:post:neon:prisma -- <id>` | production Neon Prisma 쿼리 |
| `npm run health:post:prod -- <id>` | 프로덕션 글 상세 API |

## 배포

| 명령 | 용도 |
|------|------|
| `npm run predeploy:prod` | lint · test · build · env |
| `npm run deploy:full` | 점검 후 git push → Vercel |

자세한 env: [DEPLOY.md](./DEPLOY.md) · DB: [DATABASE.md](./DATABASE.md)
