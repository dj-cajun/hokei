# loop.md — 호케이 AI 작업 감독관

> AI(에이전트)는 **어떤 태스크든 "완료" 선언 전에 이 파일의 루프를 통과**해야 한다.  
> 기능별 상세 설계는 `docs/store-partner/` 를 따른다.

## 0. 작업 시작 전

1. `docs/store-partner/TASKS.md`에서 **다음 미완료 태스크 1개**만 선택
2. 관련 문서 읽기: PRD → TRD → USER-FLOW → DB-DESIGN → SCREENS
3. 기존 코드 패턴 확인 (`src/lib/promo/`, `/promo`, `AGENTS.md`)

## 1. 필수 통과 (Pass/Fail) — 하나라도 FAIL이면 완료 불가

| # | 기준 | 명령 |
|---|------|------|
| 1 | Lint | `npm run lint` |
| 2 | Unit test | `npm test` |
| 3 | Production build | `npm run build` |
| 4 | 비밀 노출 없음 | diff에 `.env`, API key, token 없음 |
| 5 | 설계 충돌 없음 | PRD·DB-DESIGN·SCREENS와 구현 일치 (아래 체크리스트) |
| 6 | 스코프 준수 | TASKS.md 해당 태스크 범위 밖 코드 변경 없음 |

### 설계 충돌 체크 (store-partner 작업 시)

- [ ] URL은 `docs/store-partner/SCREENS.md`와 일치하는가?
- [ ] DB 필드·관계는 `docs/store-partner/DB-DESIGN.md`와 일치하는가?
- [ ] 유저 플로우 단계가 빠지지 않았는가? (`docs/store-partner/USER-FLOW.md`)
- [ ] 모바일 LP CTA(카톡·전화·지도)가 PRD Must에 포함되는가?

## 2. 측정 기준 (가능할 때)

| 지표 | 목표 |
|------|------|
| 신규 lib/API | unit test 1개 이상 |
| `/store/[slug]` | LCP 이미지 `priority` 또는 placeholder |
| Admin API | rate limit 또는 `requireAdmin` 적용 |
| Prisma 변경 | `npm run db:pg:patch` 또는 migrate 문서화 |

## 3. AI 자가 평가 (완료 보고 시 필수)

완료 선언 시 **아래 형식으로 근거 제출**:

```
### 자가 평가
- 아키텍처: (1~5) — 근거 1문장
- UX/플로우: (1~5) — 근거 1문장
- 감점 항목: (있으면) + 수정 액션
- 미완료 TASKS 항목 ID: (다음에 할 것)
```

## 4. 자동 처리 vs 인간 호출

### AI가 스스로 처리 가능

- lint/type 오류 수정
- TASKS 범위 내 테스트 추가
- `docs/store-partner/TASKS.md` 체크박스 갱신
- 네이밍·import 정리

### 반드시 인간 확인 (멈추고 질문)

- **DB 스키마 breaking change** (컬럼 삭제, 대량 rename)
- **PG·자동 결제** — 제휴 상품 범위 외 (수동 계약·이체만)
- **PRD Must 항목 삭제·변경**
- **프로덕션 env** 추가/변경 (`vercel env`)
- **force push**, main 직접 destructive git

## 5. 운영 감시 루프 (PR/CI)

1. push 후 `gh run list` 또는 GitHub Actions 확인
2. CI fail → 로그 확인 → **새 커밋**으로 수정 (amend 지양, 훅 실패 시 특히)
3. pass → `TASKS.md` 완료 표시 + 사용자에게 **머지/배포 준비 보고**

## 6. 참조 문서

| 문서 | 경로 |
|------|------|
| 제품 요구 | `docs/store-partner/PRD.md` |
| 기술 설계 | `docs/store-partner/TRD.md` |
| 유저 플로우 | `docs/store-partner/USER-FLOW.md` |
| DB | `docs/store-partner/DB-DESIGN.md` |
| 화면 | `docs/store-partner/SCREENS.md` |
| 태스크 | `docs/store-partner/TASKS.md` |
| 컨벤션 | `docs/store-partner/CONVENTIONS.md` |
| 배포 | `docs/DEPLOY.md` |
