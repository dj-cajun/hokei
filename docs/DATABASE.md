# 데이터베이스

## SQLite (기본 · 로컬 개발)

```bash
# .env
DATABASE_URL="file:./dev.db"

npm run db:seed
npm run search:reindex   # FTS5 (SQLite 전용)
npm run dev
```

`npm run dev` / `npm run build` 는 `.env`의 `DATABASE_URL`에 맞춰 Prisma Client를 자동 생성합니다.  
provider 불일치 오류 시: `npx tsx scripts/prisma-generate-for-deploy.ts` 후 dev 서버를 재시작하세요.  
로컬 저장소의 `prisma-datasource.ts`는 **SQLite 기본**이며, Vercel 빌드 시 PostgreSQL로 다시 생성됩니다.

## PostgreSQL (Docker 로컬)

한 번에 설정:

```bash
npm run db:pg:setup
```

수동 단계:

```bash
npm run db:postgres
# .env
DATABASE_URL="postgresql://hokei:hokei_local@localhost:5432/hokei"

npm run db:pg:generate
npm run db:pg:push
npm run db:seed
npm run dev
```

> **중요:** DB 종류를 바꿀 때마다 `npx tsx scripts/prisma-generate-for-deploy.ts`를 실행하세요.

## 검색

| DB | 방식 |
|----|------|
| SQLite | FTS5 (`post_fts`) + `npm run search:reindex` |
| PostgreSQL | **tsvector** (`npm run search:pg:setup`) 우선, 없으면 ILIKE 폴백 |

```bash
# PG 전환 후 한 번
npm run search:pg:setup
```

관리자 패널 **검색 재인덱스** 또는 `reindexAllSearch()`가 DB 종류에 맞게 동작합니다.

## 프로덕션 (Vercel)

- **Neon** / **Supabase** 등托管 PostgreSQL 권장
- `DATABASE_URL`에 connection pooling URL 사용 (예: `?pgbouncer=true`)
- 배포 전 `db:pg:push` 또는 `prisma migrate deploy`
- `CRON_SECRET`, `AUTH_SECRET` 필수

## SQLite → PostgreSQL 데이터 이전

```bash
# PostgreSQL 스키마·시드 후
export DATABASE_URL="postgresql://..."
npm run db:pg:setup
npm run db:migrate:sqlite-to-pg   # dev.db → PG 데이터 복사
npm run search:pg:setup
```

프로덕션(Vercel)은 빌드 시 `pg-apply-schema-patches.ts`가 migrate 실패를 보완합니다.  
마이그레이션 lock·PG 이중 운영: [prisma/migrations/README.md](../prisma/migrations/README.md)

대량 이전·드리프트 해소는 [pgloader](https://pgloader.io/) 등 전용 도구를 검토하세요.
