#!/usr/bin/env bash
# .env.production.pg 의 DATABASE_URL로 명령 실행 (비밀값 출력 안 함)
# 종료 후 로컬 SQLite Prisma Client 자동 복구 (dev 세션 오류 방지)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env.production.pg"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[with-pg-env] .env.production.pg 없음 — npx neon-new -y -e .env.production.pg 로 생성" >&2
  exit 1
fi
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
export PRISMA_SCHEMA="${PRISMA_SCHEMA:-prisma/schema.postgresql.prisma}"
export PRISMA_USE_SHELL_DATABASE_URL=1

status=0
"$@" || status=$?

if [[ "${PRISMA_SKIP_SQLITE_RESTORE:-}" != "1" ]]; then
  echo "[with-pg-env] 로컬 SQLite Prisma Client 복구 …"
  (
    cd "$ROOT"
    unset PRISMA_USE_SHELL_DATABASE_URL PRISMA_SCHEMA
    export DATABASE_URL="file:./dev.db"
    npx tsx scripts/prisma-generate-for-deploy.ts >/dev/null
  ) || echo "[with-pg-env] SQLite 복구 실패 — npm run db:generate 실행" >&2
fi

exit "$status"
