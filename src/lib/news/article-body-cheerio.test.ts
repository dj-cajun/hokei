import { describe, expect, it } from "vitest";
import { extractTextWithCheerio } from "@/lib/news/article-body-cheerio";
import { resolveSiteBodySelectors } from "@/lib/news/article-body-site-rules";

const INSIDEVINA_FIXTURE = `
<!DOCTYPE html>
<html><body>
<div id="articleViewCon">
  <p>호치민 한인 커뮤니티가 주최한 행사가 성황리에 마무리되었습니다.</p>
  <p>베트남 현지 언론에 따르면 참가자는 200명을 넘었으며 교민들의 관심이 높았다고 전했습니다.</p>
  <p>한인회 관계자는 앞으로도 정기적으로 문화 교류 프로그램을 진행할 계획이라고 밝혔습니다.</p>
</div>
</body></html>
`;

const NAVER_FIXTURE = `
<html><body>
<div id="dic_area" class="newsct_article">
  <span>서울=연합뉴스</span>
  <p>베트남 호치민에 거주하는 한국 교민 인구가 증가하고 있다.</p>
  <p>현지 한인회는 신규 입국자를 위한 안내 세미나를 매달 개최하고 있으며 비자·체류 관련 상담도 병행한다.</p>
  <p>전문가들은 동남아 진출 기업이 늘면서 교민 사회가 더욱 확대될 것으로 내다봤다.</p>
</div>
</body></html>
`;

const ASIATIME_FIXTURE = `
<html><body>
<div class="row article_txt_container">
  <div id="articleContent">
    <p>베트남 호치민에서 한국 기업들의 투자가 이어지고 있다.</p>
    <p>현지 전문가들은 동남아 시장에서 한국 브랜드의 인지도가 높아지고 있다고 분석했다.</p>
    <p>교민 단체는 신규 입국자를 위한 창업 설명회를 매달 개최할 계획이라고 밝혔다.</p>
  </div>
</div>
</body></html>
`;

const DNEWS_FIXTURE = `
<html><body>
<div class="view_container">
  <div class="view_contents innerNews">
    <p>호치민 한인회가 지역 사회 공헌 행사를 열었다.</p>
    <p>행사에는 300여 명의 교민이 참석했으며 베트남 현지 관계자도 함께했다.</p>
    <p>앞으로도 한·베트남 문화 교류 프로그램을 확대할 예정이라고 관계자가 전했다.</p>
  </div>
</div>
</body></html>
`;

describe("resolveSiteBodySelectors", () => {
  it("returns asiatime selectors", () => {
    const sels = resolveSiteBodySelectors(
      "https://www.asiatime.co.kr/article/20260617500408"
    );
    expect(sels).toContain("#articleContent");
  });

  it("returns dnews selectors", () => {
    const sels = resolveSiteBodySelectors(
      "https://www.dnews.co.kr/uhtml/view.jsp?idxno=1"
    );
    expect(sels).toContain(".view_contents.innerNews");
  });
});

describe("extractTextWithCheerio", () => {
  it("extracts InsideVina articleViewCon body", () => {
    const text = extractTextWithCheerio(
      INSIDEVINA_FIXTURE,
      "https://www.insidevina.com/news/articleView.html?idxno=1"
    );
    expect(text.length).toBeGreaterThanOrEqual(80);
    expect(text).toMatch(/호치민/);
  });

  it("extracts Naver dic_area body", () => {
    const text = extractTextWithCheerio(
      NAVER_FIXTURE,
      "https://n.news.naver.com/article/1"
    );
    expect(text.length).toBeGreaterThanOrEqual(80);
    expect(text).toMatch(/한인회/);
  });

  it("extracts AsiaTime #articleContent", () => {
    const text = extractTextWithCheerio(
      ASIATIME_FIXTURE,
      "https://www.asiatime.co.kr/article/20260617500408"
    );
    expect(text.length).toBeGreaterThanOrEqual(80);
    expect(text).toMatch(/교민|베트남/);
  });

  it("extracts DNews .view_contents", () => {
    const text = extractTextWithCheerio(
      DNEWS_FIXTURE,
      "https://www.dnews.co.kr/uhtml/view.jsp?idxno=1"
    );
    expect(text.length).toBeGreaterThanOrEqual(80);
    expect(text).toMatch(/교민|베트남/);
  });

  it("returns empty for pages without article region", () => {
    expect(
      extractTextWithCheerio(
        "<html><body><p>short</p></body></html>",
        "https://example.com"
      )
    ).toBe("");
  });
});
