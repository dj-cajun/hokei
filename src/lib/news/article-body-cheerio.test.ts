import { describe, expect, it } from "vitest";
import { extractTextWithCheerio } from "@/lib/news/article-body-cheerio";

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

describe("extractTextWithCheerio", () => {
  it("extracts InsideVina articleViewCon body", () => {
    const text = extractTextWithCheerio(INSIDEVINA_FIXTURE);
    expect(text.length).toBeGreaterThanOrEqual(80);
    expect(text).toMatch(/호치민/);
    expect(text).toMatch(/한인/);
  });

  it("extracts Naver dic_area body", () => {
    const text = extractTextWithCheerio(NAVER_FIXTURE);
    expect(text.length).toBeGreaterThanOrEqual(80);
    expect(text).toMatch(/한인회/);
  });

  it("returns empty for pages without article region", () => {
    expect(extractTextWithCheerio("<html><body><p>short</p></body></html>")).toBe(
      ""
    );
  });
});
