# 네이버 검색 API 설정

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

Vercel 등 서버에서는 Playwright가 없으므로, 네이버 없이 **VnExpress RSS만** 수집:

```bash
INGEST_RSS_ONLY=1 npm run news:ingest
```

프로덕션 Cron에도 `INGEST_RSS_ONLY=1` 환경 변수를 Vercel에 추가하면 동일하게 동작합니다.

## 키 동작 확인

```bash
npm run naver:test
```

성공 시 `OK — 뉴스 N건 샘플 수신`이 출력됩니다.

## errorCode 024

`Scope Status Invalid` / `Authentication failed` → 검색 API 미활성화이거나 Secret이 잘못됐습니다. 키 재발급 후 `npm run naver:test`로 확인하세요.
