"""네이버 뉴스 검색 HTML 크롤 테스트 (Open API 없이)"""
import urllib.parse

import requests
from bs4 import BeautifulSoup


def crawl_naver_news(search_keyword: str) -> None:
    encoded_query = urllib.parse.quote(search_keyword)
    url = f"https://search.naver.com/search.naver?where=news&query={encoded_query}&sort=1"
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/125.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")
            articles = soup.select("a.news_tit")

            print(f"👉 '{search_keyword}' 관련 최신 네이버 뉴스 검색 결과\n")

            if not articles:
                print(
                    "(a.news_tit 없음 — 네이버 검색 UI가 바뀌어 예전 셀렉터로는 못 읽음)\n"
                    "→ 페이지 안 JSON에서 제목 추출 (폴백):\n"
                )
                import re
                from html import unescape

                fallback: list[tuple[str, str]] = []
                seen: set[str] = set()
                for raw in re.findall(
                    r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"', response.text
                ):
                    title = re.sub(r"<[^>]+>", "", unescape(raw)).strip()
                    if len(title) < 12 or title in seen:
                        continue
                    if "언론사" in title and "구독" in title:
                        continue
                    seen.add(title)
                    fallback.append((title, "(HTML 내 JSON — 링크는 별도 파싱 필요)"))

                if not fallback:
                    print(f"폴백도 실패. 응답 길이: {len(response.text)} bytes")
                    return

                for idx, (title, link) in enumerate(fallback[:5], 1):
                    print(f"{idx}. {title}")
                    print(f"   링크: {link}")
                    print("-" * 60)
                return

            for idx, article in enumerate(articles[:5], 1):
                title = article.text
                link = article.get("href")
                print(f"{idx}. {title}")
                print(f"   링크: {link}")
                print("-" * 60)
        else:
            print(f"❌ 네이버 차단 발생 (상태 코드: {response.status_code})")

    except Exception as e:
        print(f"오류 발생: {e}")


if __name__ == "__main__":
    crawl_naver_news("호치민 한인")
