# 네이버 검색 API 설정

뉴스 수집 시 `401` / `errorCode 024` (Authentication failed)가 나오면:

1. [네이버 개발자센터](https://developers.naver.com/apps) → 해당 애플리케이션
2. **API 설정** → **검색** API **사용**으로 변경
3. **Client ID** · **Client Secret** 전체 값을 `.env`에 다시 붙여넣기
4. Secret이 10자 내외로 잘리지 않았는지 확인
5. `npm run news:ingest` 재실행

API가 실패해도 **Playwright 폴백**으로 일부 뉴스는 수집됩니다 (`npm run news:scrape:setup` 필요).

## 키 동작 확인

```bash
npm run naver:test
```

성공 시 `OK — 뉴스 N건 샘플 수신`이 출력됩니다.

## errorCode 024

`Scope Status Invalid` / `Authentication failed` → 검색 API 미활성화이거나 Secret이 잘못됐습니다. 키 재발급 후 `npm run naver:test`로 확인하세요.
