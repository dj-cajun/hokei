#!/usr/bin/env bash
# .env.production.pg 의 DATABASE_URL로 명령 실행 (비밀값 출력 안 함)
# 단일 Postgres: 프로덕션 DB로 작업할 때 .env.local(Neon dev) 덮어쓰기 방지
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
export PRISMA_SCHEMA="${PRISMA_SCHEMA:-prisma/schema.prisma}"
export PRISMA_USE_SHELL_DATABASE_URL=1

exec "$@"
