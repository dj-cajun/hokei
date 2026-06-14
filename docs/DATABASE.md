# 데이터베이스

이 프로젝트는 **PostgreSQL 단일**입니다. SQLite(`file:./dev.db`)는 더 이상 지원하지 않습니다.

## 환경 파일 역할

| 파일 | 용도 | Neon 브랜치 |
|------|------|-------------|
| `.env` | 로컬 `npm run dev`, 일반 스크립트 | **dev** (예: `ep-wandering-cherry-…`) |
| `.env.production.pg` | 프로덕션 DB 작업 (`news:prod:*`, Neon CLI) | **production** (예: `ep-snowy-heart-…`) |
| Vercel env | 배포 런타임·빌드 | production URL (대시보드에서 수동 설정) |

로컬 앱과 프로덕션 DB 스크립트는 **서로 다른 Neon 브랜치**를 씁니다. dev 브랜치에서 **자동 삭제(Auto-suspend/delete)** 는 끄는 것을 권장합니다.

## 로컬 개발 (Neon dev — 권장)

```bash
# .env
DATABASE_URL="postgresql://...@ep-....neon.tech/neondb?sslmode=require"

npm run db:generate   # Prisma Client (필요 시)
npm run db:seed       # 최초 1회
npm run search:pg:setup   # tsvector 검색 (최초 1회)
npm run dev           # http://localhost:3001
```

`npm run dev`는 `.env`의 PostgreSQL URL을 검증하고 연결을 예열한 뒤 Next dev를 띄웁니다.  
해외·원거리에서 Neon dev에 접속하면 첫 페이지 로드가 10초 이상 걸릴 수 있습니다.

**흔한 오류**

- `.env.local`에 `file:./dev.db`가 남아 있음 → 해당 줄 삭제
- 셸에 `export DATABASE_URL=file:…`가 남아 있음 → `unset DATABASE_URL`
- provider 불일치 → `npm run db:generate` 후 dev 서버 재시작

## Docker PostgreSQL (오프라인·로컬 전용)

Neon 없이 로컬 Docker만 쓸 때:

```bash
npm run setup:pg
# .env
DATABASE_URL="postgresql://hokei:hokei_local@localhost:5432/hokei"

npm run dev
```

수동 단계: `npm run db:postgres` → `db:pg:push` → `db:seed` → `search:pg:setup`

## 검색

PostgreSQL **tsvector** (`search_vector` 컬럼)를 사용합니다.

```bash
npm run search:pg:setup   # 스키마·트리거·초기 인덱스
```

관리자 패널 **검색 재인덱스** 또는 `reindexAllSearch()`가 PG에 맞게 동작합니다.  
`search:reindex`(FTS5)는 SQLite 전용 레거시 명령으로, 일반 개발에서는 사용하지 않습니다.

## 프로덕션 (Vercel + Neon)

- Vercel **Production** env에 Neon **production** `DATABASE_URL` 설정 (pooling URL 권장)
- `CRON_SECRET`, `AUTH_SECRET` 필수
- 배포: `npm run deploy:full` 또는 git push → Vercel 자동 빌드
- 스키마: `prisma migrate deploy` 또는 빌드 시 `pg-apply-schema-patches.ts` 보완

자세한 env: [DEPLOY.md](./DEPLOY.md)

## Neon 프로덕션 DB 작업 (로컬 CLI)

`.env.production.pg`만 사용합니다. 로컬 `.env`(dev)와 섞이지 않습니다.

```bash
# 전체 파이프라인 (env 동기화 → 수집 → 썸네일 → Prisma 재생성)
npm run news:prod:update

# 단계별
INGEST_RSS_ONLY=1 npm run news:reset:neon -- --full
npm run news:backfill-thumbnails -- --neon --missing-only
npm run news:check:prod
```

부트스트랩: `scripts/lib/neon-bootstrap.ts` (`openNeonPrisma`, `readNeonDatabaseUrl`)  
스크립트 목록: [SCRIPTS.md](./SCRIPTS.md)

마이그레이션 lock·PG 이중 운영: [prisma/migrations/README.md](../prisma/migrations/README.md)
