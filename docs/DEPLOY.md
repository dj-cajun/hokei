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
| `DATABASE_URL` | **PostgreSQL** (Neon/Supabase). `file:./dev.db`는 Vercel에서 동작하지 않음 |
| `AUTH_SECRET` | 32자+ 랜덤 (`npm run env:auth-secret`) |
| `CRON_SECRET` | Cron API 보호 (`npm run env:cron-secret`) |
| `NEXT_PUBLIC_SITE_URL` | `https://실제도메인` (localhost 금지) |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob (글 첨부·이미지) |

## 3. DB 마이그레이션 (최초 1회)

로컬에서 프로덕션 DB URL로:

```bash
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run db:pg:generate   # 또는 deploy 빌드 시 prisma generate
npm run search:pg:setup
npm run db:seed          # 최초 카테고리·관리자 (선택)
```

## 4. Cron (뉴스 수집)

`vercel.json`: 매일 **02:00 UTC** (= 09:00 ICT)

Vercel Cron 요청 시 헤더:

```
Authorization: Bearer <CRON_SECRET>
```

> Vercel 서버에는 Playwright가 없어 **네이버 API 키**가 정상이어야 합니다. (`npm run naver:test`)

## 5. Upstash (권장)

프로덕션 Rate limit은 **Upstash Redis** 없으면 인스턴스별 메모리 제한만 적용됩니다.

## 6. 소셜 로그인

Google/Kakao 콘솔에 **프로덕션 도메인**과 redirect URI 등록:

- `https://<도메인>/api/auth/callback/google` (NextAuth)
- 카카오: `/api/auth/kakao/callback`

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
