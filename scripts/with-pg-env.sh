#!/usr/bin/env bash
# .env.production.pg 의 DATABASE_URL로 명령 실행 (비밀값 출력 안 함)
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
exec "$@"
