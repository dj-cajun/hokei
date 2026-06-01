#!/usr/bin/env python3
"""기사 URL에서 제목·본문·og:image 추출 (JSON stdout) — 순수 본문만"""
import json
import random
import re
import sys
import time

from playwright.sync_api import sync_playwright

try:
    from playwright_stealth import stealth_sync
except ImportError:
    stealth_sync = None  # type: ignore

TITLE_SELECTORS = [
    "h2#title_area",
    "h2.media_end_head_headline",
    "h1.title",
    "h1.headline",
    "h1.article_title",
    "h1#article_title",
    "h1",
    "meta[property='og:title']",
]

BODY_SELECTORS = [
    "div#dic_area",
    "article#dic_area",
    "div#articleBody",
    "div#article-body",
    "div#article-view-content-div",
    "div.article-body",
    "div.news_body",
    "div#news_body",
    "div.fck_detail",
    "article.fck_detail",
    "div[itemprop='articleBody']",
    "article[itemprop='articleBody']",
    "div#articeBody",
    "div#content",
    "article.post-content",
]

# 본문 밖/꼬리 요소 DOM 제거
REMOVE_IN_BODY_JS = """
(root) => {
  const selectors = [
    'figcaption', 'figure', 'aside', 'nav', 'script', 'style',
    '.end_photo_org', '.nbd_im_cm', '.media_end_linked', '.relation_news',
    '.related_news', '.related_article', '.link_news', '.list_news',
    '.tag_group', '.tag_area', '.keyword_tag', '.ArticleTag', '.tags',
    '#journalistArea', '.journalist_area', '.reporter_area', '.byline',
    '.media_end_head_info', '.media_end_head_journalist', '.press_logo',
    '.media_end_summary', '.media_end_summary_title', '.art_subtit',
    '.sub_tit', '.subtit', '.short_summary', '.summary_area',
    '.article_summary', '.cp_area', '.media_end_categorize',
    '.fck_related', '.news_relation', '.promotion', '.ad_area', '.banner',
    '.vod_player', '.video_area', 'em.img_desc', '.img_desc', '.caption',
    '.author', '.reporter', '.source', '.breadcrumb',
  ];
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((n) => n.remove());
  });
}
"""

SECTION_CUTOFF = re.compile(
    r"^(관련\s*기사|관련\s*뉴스|다른\s*기사|이\s*기사도|추천\s*기사|"
    r"많이\s*본\s*뉴스|핫\s*뉴스|태그\s*[:：]|◆\s*태그|읽어볼만한|함께\s*읽기)",
    re.I,
)

MEDIA_LINE = re.compile(
    r"^(네이버|naver|VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스|"
    r"연합뉴스|뉴시스|오센|조선|중앙|한겨레|파이낸셜|아시아경제)"
    r"(\s*뉴스)?(\s*[·/|.]\s*)?"
    r"(\s*(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스))?\.?\s*$",
    re.I,
)

MEDIA_GLUED = re.compile(
    r"^네이버\s*\.?\s*(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)\s*\.?\s*$",
    re.I,
)

MEDIA_INLINE = re.compile(
    r"네이버\s*(?:뉴스\s*)?(?:[·/|.]\s*)?"
    r"(?:VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)?|"
    r"(?:VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)",
    re.I,
)

DROP_LINE = re.compile(
    r"(^https?://|^www\.|무단\s*전재|저작권|copyright|"
    r"^사진\s*[=:/]|^▲|^※|^■|^◇|"
    r"요약|"
    r"^▶|^☞|더보기|기사\s*원문|다른\s*기사|"
    r"^태그\s*[:：]|기자\s*=\s*@|^(입력|수정|발행)\s*[:：]|"
    r"\S+@\S+\.\S+|"
    r"특파원|인턴\s*기자|수습\s*기자)",
    re.I | re.M,
)

REPORTER_LINE = re.compile(
    r"^[가-힣A-Za-z.\s]{1,24}\s*(특파원|기자)(\s*[|｜·]\s*)?(\S+@\S+)?\s*$"
)

BYLINE_BRACKET_LINE = re.compile(r"^\[[^\]=\[\]]{1,48}=[^\]]{1,96}\]\s*$", re.I)
BYLINE_BRACKET_PREFIX = re.compile(r"^\[[^\]=\[\]]{1,48}=[^\]]{1,96}\]\s*", re.I)


def _strip_byline(text: str) -> str:
    s = text.strip()
    while BYLINE_BRACKET_PREFIX.match(s):
        s = BYLINE_BRACKET_PREFIX.sub("", s, count=1).strip()
    return s

PHOTO_CAPTION = re.compile(
    r"^.{0,100}(사진\s*[=:]|촬영\s*[=:]|제공\s*[=:]|ⓒ|©|공동촬영).{0,80}$",
    re.I,
)


def _text(el) -> str:
    if el is None:
        return ""
    try:
        return (el.inner_text() or "").strip()
    except Exception:
        return ""


def _meta_content(page, prop: str) -> str:
    el = page.query_selector(f"meta[property='{prop}']")
    if el:
        return (el.get_attribute("content") or "").strip()
    return ""


def _pick_title(page) -> str:
    for sel in TITLE_SELECTORS:
        if sel.startswith("meta"):
            t = _meta_content(page, "og:title")
            if len(t) > 4:
                return t
            continue
        el = page.query_selector(sel)
        t = _text(el)
        if len(t) > 4:
            return t
    return _meta_content(page, "og:title")


def _extract_body_text(el, page) -> str:
    try:
        page.evaluate(REMOVE_IN_BODY_JS, el)
    except Exception:
        pass
    return _text(el)


def _pick_body(page) -> str:
    best = ""
    for sel in BODY_SELECTORS:
        el = page.query_selector(sel)
        if not el:
            continue
        t = _extract_body_text(el, page)
        if len(t) > len(best):
            best = t
    if len(best) >= 80:
        return best

    for sel in ["article", "main"]:
        for el in page.query_selector_all(sel):
            t = _extract_body_text(el, page)
            if len(t) > len(best) and len(t) < 50_000:
                best = t
    return best


def _is_noise(line: str) -> bool:
    if len(line) < 2:
        return True
    if SECTION_CUTOFF.match(line):
        return True
    if BYLINE_BRACKET_LINE.match(line):
        return True
    if MEDIA_LINE.match(line) or MEDIA_GLUED.match(line):
        return True
    if len(line) < 60 and MEDIA_INLINE.search(line) and len(MEDIA_INLINE.sub("", line).strip()) < 8:
        return True
    if DROP_LINE.search(line):
        return True
    if PHOTO_CAPTION.match(line):
        return True
    if REPORTER_LINE.match(line):
        return True
    if re.match(r"^https?://\S+$", line, re.I):
        return True
    if re.search(r"\(스크래핑\)", line, re.I):
        return True
    return False


def _clean_body(text: str) -> str:
    if not text:
        return ""

    cut = text
    m = re.search(
        r"\n\s*(관련\s*기사|관련\s*뉴스|다른\s*기사|많이\s*본|◆\s*태그)",
        text,
        re.I,
    )
    if m and m.start() > 150:
        cut = text[: m.start()]

    lines = []
    for block in re.split(r"\n{2,}", cut):
        for ln in block.splitlines():
            s = re.sub(r"\(스크래핑\)", "", ln, flags=re.I)
            s = MEDIA_INLINE.sub(" ", s)
            s = re.sub(r"네이버\s*\.?\s*(?:VnExpress|vnexpress)\s*", " ", s, flags=re.I)
            s = re.sub(r"\s+", " ", s).strip()
            s = _strip_byline(s)
            if s:
                lines.append(s)

    while lines and _is_noise(lines[0]):
        lines.pop(0)
    while lines and _is_noise(lines[-1]):
        lines.pop()

    paragraphs = []
    buf = []
    for line in lines:
        if SECTION_CUTOFF.match(line):
            break
        if _is_noise(line):
            if buf:
                merged = " ".join(buf).strip()
                if len(merged) >= 20 and not _is_noise(merged):
                    paragraphs.append(merged)
                buf = []
            continue
        buf.append(line)
        if re.search(r"[.!?…]|[다요죠]\s*$", line) or len(line) >= 80:
            merged = " ".join(buf).strip()
            if len(merged) >= 20 and not _is_noise(merged):
                paragraphs.append(merged)
            buf = []
    if buf:
        merged = " ".join(buf).strip()
        if len(merged) >= 20 and not _is_noise(merged):
            paragraphs.append(merged)

    return "\n\n".join(paragraphs).strip()


def scrape_article(url: str) -> dict:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        if stealth_sync:
            stealth_sync(page)
        page.set_extra_http_headers({"Referer": "https://www.naver.com/"})
        page.goto(url, wait_until="domcontentloaded", timeout=35_000)
        time.sleep(random.uniform(2, 3.5))

        title = _pick_title(page)
        content = _clean_body(_pick_body(page))
        og = page.query_selector("meta[property='og:image']")
        img_url = og.get_attribute("content") if og else None

        browser.close()
        return {"title": title, "content": content, "img": img_url}


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: scrape_article.py <url>"}))
        sys.exit(1)
    url = sys.argv[1]
    try:
        print(json.dumps(scrape_article(url), ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
