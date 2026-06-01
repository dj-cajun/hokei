# Sentry (Next.js) 설정

## 프로젝트 정보

| 항목 | 값 |
|------|-----|
| Organization | `nam-bac-technology-and-service` |
| Project | `javascript-nextjs` |
| 대시보드 | https://sentry.io |

## 1. DSN 복사

Sentry → **Settings → Projects → javascript-nextjs → Client Keys (DSN)**

`.env`에 추가 (서버·클라이언트 **같은 DSN** 사용):

```env
SENTRY_DSN="https://xxxx@o....ingest.sentry.io/...."
NEXT_PUBLIC_SENTRY_DSN="https://xxxx@o....ingest.sentry.io/...."
SENTRY_ORG="nam-bac-technology-and-service"
SENTRY_PROJECT="javascript-nextjs"
```

Vercel에도 동일 변수 4개를 넣고 **재배포**하세요.

## 2. 로컬 확인

```bash
npm run dev
```

브라우저: http://localhost:3001/sentry-example-page

- 「프론트엔드 테스트 에러」 또는 「API 테스트 에러」 클릭
- Sentry **Issues**에 이벤트가 보이면 성공

## 3. 이미 적용된 파일

- `sentry.server.config.ts` / `sentry.edge.config.ts`
- `src/instrumentation.ts` / `src/instrumentation-client.ts`
- `src/app/global-error.tsx`
- `next.config.ts` — `withSentryConfig`

DSN이 없으면 Sentry는 **비활성** (`enabled: false`)이라 로컬 개발에 영향 없습니다.

## 4. 위자드 (선택)

설정을 처음부터 다시 하려면:

```bash
npx @sentry/wizard@latest -i nextjs --saas \
  --org nam-bac-technology-and-service \
  --project javascript-nextjs
```

이미 수동 설정이 되어 있어 **DSN만 넣으면** 위자드 없이 동작합니다.
