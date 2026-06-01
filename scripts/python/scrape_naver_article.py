#!/usr/bin/env python3
"""네이버 뉴스 기사 1건 — 제목·본문·og:image (JSON stdout)"""
import json
import random
import sys
import time

from playwright.sync_api import sync_playwright

try:
    from playwright_stealth import stealth_sync
except ImportError:
    stealth_sync = None  # type: ignore


def scrape_naver_news(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        if stealth_sync:
            stealth_sync(page)
        page.set_extra_http_headers({"Referer": "https://www.naver.com/"})
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        time.sleep(random.uniform(2, 4))

        title_el = page.query_selector("h2#title_area, h2.media_end_head_headline")
        title = title_el.inner_text().strip() if title_el else ""

        og = page.query_selector("meta[property='og:image']")
        img_url = og.get_attribute("content") if og else None

        body_el = page.query_selector("div#dic_area, article#dic_area")
        content = body_el.inner_text().strip() if body_el else ""

        browser.close()
        return {"title": title, "img": img_url, "content": content}


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: scrape_naver_article.py <url>"}))
        sys.exit(1)
    url = sys.argv[1]
    try:
        print(json.dumps(scrape_naver_news(url), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
