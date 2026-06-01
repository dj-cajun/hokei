#!/usr/bin/env python3
"""네이버 뉴스 검색 결과 목록 (JSON stdout) — API 없을 때 대체"""
import json
import random
import sys
import time
import urllib.parse
from datetime import datetime, timezone

from playwright.sync_api import sync_playwright

try:
    from playwright_stealth import stealth_sync
except ImportError:
    stealth_sync = None  # type: ignore


def scrape_search(query: str, max_items: int = 5) -> list[dict]:
    q = urllib.parse.quote(query)
    url = f"https://search.naver.com/search.naver?where=news&sm=tab_jum&query={q}"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        if stealth_sync:
            stealth_sync(page)
        page.set_extra_http_headers({"Referer": "https://www.naver.com/"})
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        time.sleep(random.uniform(2, 3))

        items: list[dict] = []
        seen: set[str] = set()

        # 구 UI
        wraps = page.query_selector_all("div.news_wrap, li.bx")
        for wrap in wraps:
            if len(items) >= max_items:
                break
            tit = wrap.query_selector("a.news_tit, a.info")
            if not tit:
                continue
            href = tit.get_attribute("href") or ""
            title = (tit.inner_text() or "").strip()
            if not href.startswith("http") or len(title) < 4 or href in seen:
                continue
            seen.add(href)
            dsc_el = wrap.query_selector(".news_dsc, .dsc_wrap")
            description = (dsc_el.inner_text() if dsc_el else title).strip()
            items.append(
                {
                    "title": title[:300],
                    "link": href,
                    "description": description[:2000],
                    "pubDate": datetime.now(timezone.utc).isoformat(),
                }
            )

        # 신 UI (2024~ sds-comps)
        if len(items) < max_items:
            heads = page.locator("span.sds-comps-text-type-headline1")
            for i in range(heads.count()):
                if len(items) >= max_items:
                    break
                head = heads.nth(i)
                title = (head.inner_text() or "").strip()
                if len(title) < 4:
                    continue
                anchor = head.locator("xpath=ancestor::a[1]")
                if anchor.count() == 0:
                    continue
                href = anchor.first.get_attribute("href") or ""
                if not href.startswith("http") or href in seen:
                    continue
                seen.add(href)
                box = head.locator(
                    "xpath=ancestor::*[contains(@class,'bx') or contains(@class,'news')][1]"
                )
                dsc = ""
                if box.count():
                    body = box.first.locator(
                        "span.sds-comps-text-type-body1, .news_dsc, .dsc_wrap"
                    )
                    if body.count():
                        dsc = (body.first.inner_text() or "").strip()
                items.append(
                    {
                        "title": title[:300],
                        "link": href,
                        "description": (dsc or title)[:2000],
                        "pubDate": datetime.now(timezone.utc).isoformat(),
                    }
                )

        browser.close()
        return items


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: scrape_naver_search.py <query> [max]"}))
        sys.exit(1)
    query = sys.argv[1]
    max_items = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    try:
        print(json.dumps(scrape_search(query, max_items), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
