import { describe, expect, it } from "vitest";
import { extractArticleBodyFromJsonLd } from "@/lib/news/article-body-jsonld";

describe("extractArticleBodyFromJsonLd", () => {
  it("extracts NewsArticle articleBody", () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "NewsArticle",
        "headline": "테스트",
        "articleBody": "<p>베트남 호치민 교민 사회가 성장하고 있다.</p><p>한인회는 신규 입국자 지원 프로그램을 확대한다.</p>"
      }
      </script>
    `;
    const text = extractArticleBodyFromJsonLd(html);
    expect(text.length).toBeGreaterThanOrEqual(40);
    expect(text).toMatch(/호치민/);
  });

  it("reads articleBody from @graph", () => {
    const html = `
      <script type="application/ld+json">
      {
        "@graph": [
          { "@type": "WebPage", "name": "x" },
          {
            "@type": "NewsArticle",
            "articleBody": "다낭 관광객이 늘면서 한국어 안내 서비스 수요가 증가하고 있다. 현지 업체들이 한국 시장을 겨냥한 상품을 내놓고 있다."
          }
        ]
      }
      </script>
    `;
    const text = extractArticleBodyFromJsonLd(html);
    expect(text).toMatch(/다낭/);
  });
});
