# Prisma 마이그레이션

## 구조 (단일 PostgreSQL)

로컬·프로덕션 모두 **PostgreSQL** 단일 스키마(`prisma/schema.prisma`)를 사용합니다.
로컬 개발은 Neon dev 브랜치, 프로덕션은 Neon production 브랜치를 가리킵니다.

`prisma/migrations/`의 기존 마이그레이션은 초기 SQLite 시절 산출물이라
`migration_lock.toml`이 `sqlite`입니다. 따라서 Neon/Vercel에서 `prisma migrate deploy`만으로는
**P3019**가 날 수 있어, 프로덕션 빌드는 `scripts/prisma-generate-for-deploy.ts`가
PG Client를 생성한 뒤 `scripts/pg-apply-schema-patches.ts`(`pg-patch`)로
누락 컬럼·테이블·인덱스를 idempotent 하게 보완합니다.

## 로컬 / 프로덕션 공통

```bash
DATABASE_URL="postgresql://..." npm run db:generate
npm run db:pg:push        # 스키마 반영 (db push)
npm run search:pg:setup   # 전문 검색(FTS) 설정
```

자세한 내용: [docs/DATABASE.md](../../docs/DATABASE.md)
