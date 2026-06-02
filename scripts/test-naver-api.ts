/**
 * 네이버 검색 API 키 동작 확인
 * npm run naver:test
 */
import "dotenv/config";

const clientId = process.env.NAVER_CLIENT_ID?.trim();
const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error("[naver:test] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 없음");
  process.exit(1);
}

if (clientSecret.length < 20) {
  console.warn(
    `[naver:test] Client Secret 길이 ${clientSecret.length}자 — 보통 20자 이상입니다. 잘림·오타 여부를 확인하세요.`
  );
}

async function main() {
  const q = encodeURIComponent("호치민 한인");
  const url = `https://openapi.naver.com/v1/search/news.json?query=${q}&display=3&sort=date`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId as string,
      "X-Naver-Client-Secret": clientSecret as string,
    },
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[naver:test] HTTP ${res.status}`);
    console.error(text.slice(0, 400));
    console.error("\n→ docs/NAVER_API.md 참고");
    process.exit(1);
  }

  const data = JSON.parse(text) as {
    errorCode?: string;
    errorMessage?: string;
    items?: unknown[];
  };

  if (data.errorCode) {
    console.error(`[naver:test] API ${data.errorCode}: ${data.errorMessage}`);
    process.exit(1);
  }

  console.log(`[naver:test] OK — 뉴스 ${data.items?.length ?? 0}건 샘플 수신`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
