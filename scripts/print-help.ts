console.log(`
호케이 — Cursor 통합 터미널 명령

【 처음 한 번 】
  npm run setup          SQLite DB + 시드 + 검색 인덱스
  npm run setup:pg       Docker PostgreSQL 전체 설정
  npm run env:auth-secret    AUTH_SECRET 교체
  npm run env:cron-secret    CRON_SECRET 추가·교체
  npm run env:check          .env 필수 항목 점검
  npm run verify             헤더 + env 종합
  npm run naver:test         네이버 API 키

【 매일 개발 】
  npm run dev            http://localhost:3001

【 DB — SQLite (기본) 】
  npm run db:generate    Prisma Client 생성
  npm run db:push        스키마 → DB 반영
  npm run db:seed        회원·카테고리 시드
  npm run db:sync:category-descriptions  카테고리 설명만 DB 동기화
  npm run db:seed:e2e    CI·E2E용 샘플 글 1건
  npm run db:studio      Prisma Studio GUI
  npm run search:reindex FTS 검색 인덱스 (SQLite만)
  npm run search:pg:setup  PG tsvector 검색 (PostgreSQL)
  npm run db:migrate:sqlite-to-pg  SQLite 데이터 → PG

【 DB — PostgreSQL 】
  npm run db:postgres    Docker만 기동
  npm run db:pg:generate PG용 Client 생성 (.env DATABASE_URL=postgresql://…)
  npm run db:pg:push     PG 스키마 반영
  npm run db:pg:studio   PG Prisma Studio

【 배포 】
  npm run predeploy      배포 전 점검 (lint·test·build)
  npm run predeploy:prod 프로덕션 env 규칙 포함
  npm run vercel:env     Vercel 환경 변수 목록

【 품질 】
  npm run lint
  npm run test
  npm run test:coverage  lib 커버리지 리포트
  npm run test:e2e       (dev 서버 켠 뒤, 또는 CI는 build 후 start)
  npm run check          lint + test + build

【 뉴스 】
  npm run news:ingest    수동 뉴스 수집
`);
