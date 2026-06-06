# Prisma 마이그레이션

## 구조

| 환경 | 스키마 | 마이그레이션 |
|------|--------|-------------|
| 로컬 SQLite | `prisma/schema.prisma` | `prisma/migrations/` (`migration_lock.toml` = **sqlite**) |
| 프로덕션 PG | `prisma/schema.postgresql.prisma` | `migrate deploy` + `scripts/pg-apply-schema-patches.ts` |

`migration_lock.toml`이 `sqlite`이므로 Neon/Vercel에서 `prisma migrate deploy`만으로는 **P3019**가 날 수 있습니다.  
프로덕션 빌드는 `scripts/prisma-generate-for-deploy.ts`가 PG Client 생성 후 `pg-patch`로 누락 컬럼·테이블을 idempotent 보완합니다.

## 로컬

```bash
# SQLite
DATABASE_URL="file:./dev.db" npm run db:generate
npx prisma db push

# PostgreSQL (Docker/Neon)
DATABASE_URL="postgresql://..." npm run db:generate
npm run db:pg:push
```

## SQLite → PostgreSQL 데이터 이전

```bash
npm run db:migrate:sqlite-to-pg
npm run search:pg:setup
```

자세한 내용: [docs/DATABASE.md](../../docs/DATABASE.md)
