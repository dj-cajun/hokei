#!/usr/bin/env python3
"""
네이버 뉴스 검색 — requests + BeautifulSoup (Open API 없이).
Next.js: child_process로 호출, stdout에 JSON 배열 출력.

1) 2024~2026 CSS 셀렉터
2) 실패 시 HTML 내 embedded JSON에서 title·link 추출
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
from datetime import datetime, timezone
from html import unescape

import requests
from bs4 import BeautifulSoup

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)

SELECTORS = (
    "div.news_contents a.news_tit",
    "div.news_area a.api_txt_lines",
    "div.news_area a.news_tit",
    "a.news_tit",
    "div.news_wrap a.news_tit",
    "a.api_txt_lines.total_tit",
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean_title(raw: str) -> str:
    return re.sub(r"<[^>]+>", "", unescape(raw)).strip()


def _pick_articles_from_soup(soup: BeautifulSoup, max_items: int) -> list[dict]:
    seen: set[str] = set()
    out: list[dict] = []

    for sel in SELECTORS:
        for el in soup.select(sel):
            if len(out) >= max_items:
                return out
            href = (el.get("href") or "").strip()
            title = (el.get_text() or "").strip()
            if not href.startswith("http") or len(title) < 4 or href in seen:
                continue
            seen.add(href)
            out.append(
                {
                    "title": title[:300],
                    "link": href,
                    "description": title[:2000],
                    "pubDate": _now_iso(),
                }
            )
        if out:
            return out

    # sds-comps 헤드라인 (2024~ UI)
    for head in soup.select("span.sds-comps-text-type-headline1"):
        if len(out) >= max_items:
            break
        title = (head.get_text() or "").strip()
        if len(title) < 4:
            continue
        parent_a = head.find_parent("a")
        if not parent_a:
            continue
        href = (parent_a.get("href") or "").strip()
        if not href.startswith("http") or href in seen:
            continue
        seen.add(href)
        dsc = ""
        box = head.find_parent(
            lambda tag: tag.name == "div"
            and tag.get("class")
            and any("news" in c or "bx" in c for c in tag.get("class", []))
        )
        if box:
            body = box.select_one(
                "span.sds-comps-text-type-body1, .news_dsc, .dsc_wrap"
            )
            if body:
                dsc = (body.get_text() or "").strip()
        out.append(
            {
                "title": title[:300],
                "link": href,
                "description": (dsc or title)[:2000],
                "pubDate": _now_iso(),
            }
        )

    return out


def _pick_articles_from_embedded_html(html: str, max_items: int) -> list[dict]:
    """a.news_tit 없을 때 HTML 내 JSON title + 기사 URL 순서 매칭."""
    titles: list[str] = []
    seen_t: set[str] = set()
    for raw in re.findall(r'"title"\s*:\s*"((?:[^"\\]|\\.)*)"', html):
        title = _clean_title(raw)
        if len(title) < 12 or title in seen_t:
            continue
        if "언론사" in title and "구독" in title:
            continue
        seen_t.add(title)
        titles.append(title[:300])

    links: list[str] = []
    seen_l: set[str] = set()
    link_patterns = [
        r"https://n\.news\.naver\.com/mnews/article/\d+/\d+[^\"\\<\s]*",
        r"https://news\.naver\.com/[^\"\\<\s]+",
        r"https://[^\"\\]+/article[^\"\\]{10,180}",
    ]
    for pat in link_patterns:
        for m in re.finditer(pat, html):
            u = m.group(0).split("\\")[0].replace("&amp;", "&")
            if "pstatic.net" in u or u in seen_l:
                continue
            seen_l.add(u)
            links.append(u)

    out: list[dict] = []
    for i, title in enumerate(titles):
        if len(out) >= max_items:
            break
        link = links[i] if i < len(links) else ""
        if not link.startswith("http"):
            continue
        out.append(
            {
                "title": title,
                "link": link,
                "description": title[:2000],
                "pubDate": _now_iso(),
            }
        )
    return out


def scrape_news(keyword: str, max_items: int = 5) -> str:
    encoded = urllib.parse.quote(keyword)
    url = (
        f"https://search.naver.com/search.naver"
        f"?where=news&query={encoded}&sort=1"
    )
    headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    }

    try:
        res = requests.get(url, headers=headers, timeout=20)
        if res.status_code != 200:
            return json.dumps({"error": f"HTTP {res.status_code}"}, ensure_ascii=False)

        soup = BeautifulSoup(res.text, "html.parser")
        items = _pick_articles_from_soup(soup, max_items)
        if len(items) < max_items:
            embedded = _pick_articles_from_embedded_html(res.text, max_items)
            seen = {x["link"] for x in items}
            for row in embedded:
                if len(items) >= max_items:
                    break
                if row["link"] not in seen:
                    seen.add(row["link"])
                    items.append(row)

        return json.dumps(items[:max_items], ensure_ascii=False)
    except Exception as e:
        return json.dumps({"error": str(e)}, ensure_ascii=False)


def main() -> None:
    search_term = sys.argv[1] if len(sys.argv) > 1 else "보스턴 한인"
    max_items = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    raw = scrape_news(search_term, max_items)
    parsed = json.loads(raw)
    if isinstance(parsed, dict) and parsed.get("error"):
        print(raw)
        sys.exit(1)
    print(raw)


if __name__ == "__main__":
    main()
