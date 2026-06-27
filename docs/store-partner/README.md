# 업소 제휴 · 배너 · 모바일 LP

호케이 **B2B 홍보 상품**(배너 → 가게 모바일 랜딩) 기획·개발 문서 모음.

| 파일 | 역할 |
|------|------|
| [PRD.md](./PRD.md) | 제품 요구사항 |
| [TRD.md](./TRD.md) | 기술·아키텍처 |
| [USER-FLOW.md](./USER-FLOW.md) | 사용자·운영자 흐름 |
| [DB-DESIGN.md](./DB-DESIGN.md) | 테이블 설계 |
| [SCREENS.md](./SCREENS.md) | 화면·URL |
| [TASKS.md](./TASKS.md) | 개발 순서 |
| [CONVENTIONS.md](./CONVENTIONS.md) | 코딩 규칙 |

**AI 작업 시 프로젝트 루트 [`loop.md`](../../loop.md) 를 반드시 따른다.**

---

## 프로덕션 운영 (데모·QA)

배포 후 제휴 기능 점검 순서:

```bash
# 1) 스키마 패치 (Vercel 빌드 훅 또는 로컬)
npm run db:pg:patch

# 2) 데모 업소 시드 (경량 · 영업 미팅용)
DATABASE_URL="postgresql://..." npm run db:seed:partner-demo

# 3) 풀 데모 (2D Sketch Cafe — LP 7섹션 + 홍보글 + HOME_TOP)
DATABASE_URL="postgresql://..." npm run db:seed:2d-sketch-cafe

# 4) 프로덕션 스모크
npm run check:prod
# → /, /partners, /store/saigon-bbq-demo 포함
```

| URL | 용도 |
|-----|------|
| `/store/saigon-bbq-demo` | 경량 데모 LP |
| `/store/2d-sketch-cafe` | 풀 콘텐츠 데모 (시드 후) |
| `/admin/partners` | 운영자 CRUD · HOME_TOP 통합 폼 |
| `/account/partner` | 사장님 셀프 수정 |

**수금:** PG 없음 — `ads@hokei.vn` 수동 계약·이체만.
