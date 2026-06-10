# Vercel 배포 가이드

## 1. 배포 전 로컬 점검

```bash
npm run predeploy              # lint · test · build · env
npm run predeploy -- --production   # 프로덕션 env 규칙 검사
npm run vercel:env               # Vercel에 넣을 변수 목록
```

## 2. 필수 환경 변수 (Vercel)

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | **PostgreSQL** (Neon/Supabase). `file:./dev.db`는 Vercel에서 동작하지 않음. **Production·Preview·Development(빌드) 모두** 체크 — 빌드에 없으면 SQLite Client가 생성되어 `google_login_failed` / `google_db_config` 발생 |
| `AUTH_SECRET` | 32자+ 랜덤 (`npm run env:auth-secret`) |
| `CRON_SECRET` | Cron API 보호 (`npm run env:cron-secret`) |
| `NEXT_PUBLIC_SITE_URL` | `https://실제도메인` (localhost 금지) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob (글 첨부·뉴스 썸네일 ingest 복사) |
| `RESEND_API_KEY` · `EMAIL_FROM` | 이메일 회원가입 인증 (미설정 시 Google 로그인만) |
| `UPSTASH_REDIS_REST_URL` · `TOKEN` | 분산 rate limit (권장) |

## 3. DB 마이그레이션 (최초 1회)

Neon 등 PostgreSQL URL 확보 후 (예: `npx neon-new -y -e .env.production.pg`):

```bash
export DATABASE_URL="postgresql://..."   # .env.production.pg 참고
npx prisma db push                      # PRISMA_SCHEMA=prisma/schema.postgresql.prisma
npm run db:migrate:sqlite-to-pg         # 기존 dev.db 데이터 이전
npm run search:pg:setup
npm run db:sync:category-descriptions
npx vercel env add DATABASE_URL production   # Vercel에 동일 URL 등록
```

> 빌드 시 `tsx scripts/prisma-generate-for-deploy.ts`가 `DATABASE_URL`에 맞는 Prisma Client를 생성합니다.

## 4. Cron (뉴스 수집)

`vercel.json`: 매일 **07:00·12:00 ICT** (`0 0 * * *` · `0 5 * * *` UTC, 일 15건 상한)

Vercel Cron 요청 시 헤더:

```
Authorization: Bearer <CRON_SECRET>
```

> Vercel에는 Playwright·Python 스크래퍼가 없습니다. **네이버 API를 쓰지 않고** VnExpress·인사이드비나·Vietnam.vn RSS + Gemini/Z.AI 번역으로 수집합니다 (`INGEST_RSS_ONLY`는 Vercel에서 자동). 로컬에서 네이버 API·스크래퍼 테스트: `npm run naver:test`

## 5. Upstash (권장)

프로덕션 Rate limit은 **Upstash Redis** 없으면 인스턴스별 메모리 제한만 적용됩니다.

## 6. 소셜 로그인

Google Cloud 콘솔에 **프로덕션 도메인**과 redirect URI 등록:

- `https://<도메인>/api/auth/google/redirect` (GIS redirect)
- Authorized JavaScript origins: `https://<도메인>`, `http://localhost:3001`

## 7. 배포 후 확인

- [ ] 홈·검색·게시글 상세·댓글
- [ ] 로그인·글쓰기·이미지 업로드
- [ ] `/api/cron/news` 수동 호출 (Bearer)
- [ ] 관리자 `/admin` 뉴스 수집
- [ ] 카테고리 설명 복구: `DATABASE_URL=postgresql://... npm run db:sync:category-descriptions`

## 8. SQLite 데이터 이전

기존 `dev.db` 데이터가 있으면:

```bash
DATABASE_URL=postgresql://... npm run db:migrate:sqlite-to-pg
```

## 9. GitHub CI

`main` push 시 Node 22 + `npm ci` + E2E smoke. 로컬과 동일하게 맞추려면 Node 22 사용.
