# 네이버 검색 API (로컬·선택)

> **프로덕션(Vercel)은 네이버 API를 사용하지 않습니다.**  
> RSS 우회(VnExpress·인사이드비나·Vietnam.vn) + Gemini/Z.AI 번역이 기본입니다.  
> 아래 설정은 **로컬 개발**에서 네이버 API 또는 스크래퍼를 쓸 때만 해당합니다.

뉴스 수집 시 `401` / `errorCode 024` (Authentication failed)가 나오면:

1. [네이버 개발자센터](https://developers.naver.com/apps) → 해당 애플리케이션
2. **API 설정** → **검색** API **사용**으로 변경
3. **Client ID** · **Client Secret** 전체 값을 `.env`에 다시 붙여넣기
4. Client ID(긴 값)와 Client Secret(짧은 값, 10자 전후도 정상)을 **각각** 올바른 줄에 넣었는지 확인
5. `npm run news:ingest` 재실행

Open API(024) 없이도 **requests 스크래퍼 → Playwright 폴백**으로 수집합니다.

```bash
pip3 install -r scripts/python/requirements.txt
# Playwright 2차 폴백 (선택)
npm run news:scrape:setup
# 미리보기 API
curl "http://localhost:3001/api/news?q=호치민+한인"
```

Vercel(프로덕션)은 **자동으로 RSS 우회 모드**입니다. 수동으로 맞추려면:

```bash
INGEST_RSS_ONLY=1 npm run news:ingest
```

프로덕션 Cron은 `VERCEL=1` 환경에서 RSS만 사용하므로 `NAVER_CLIENT_ID`는 **필수가 아닙니다**.

## 키 동작 확인

```bash
npm run naver:test
```

성공 시 `OK — 뉴스 N건 샘플 수신`이 출력됩니다.

## errorCode 024

`Scope Status Invalid` / `Authentication failed` → 검색 API 미활성화이거나 Secret이 잘못됐습니다. 키 재발급 후 `npm run naver:test`로 확인하세요.
