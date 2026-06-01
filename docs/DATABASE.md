# 데이터베이스

## SQLite (기본 · 로컬 개발)

```bash
# .env
DATABASE_URL="file:./dev.db"

npm run db:seed
npm run search:reindex   # FTS5 (SQLite 전용)
npm run dev
```

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

> **중요:** PostgreSQL 사용 시 `npm run db:pg:generate`로 클라이언트를 다시 생성해야 합니다.  
> SQLite로 돌아갈 때는 `npx prisma generate`(기본 schema)를 실행하세요.

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

자동 마이그레이션 스크립트는 없습니다. 소량이면:

1. PostgreSQL에 `db:pg:setup`으로 스키마·시드
2. 필요 시 SQLite 데이터를 수동 export/import

대량 이전은 [pgloader](https://pgloader.io/) 등 전용 도구를 검토하세요.
