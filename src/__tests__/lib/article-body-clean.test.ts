import { describe, expect, it } from "vitest";
import { cleanArticleBody } from "@/lib/news/article-body-clean";
import {
  applyArticleRegexFilters,
  stripLeadingBylines,
  stripTrailingBoilerplate,
} from "@/lib/news/article-body-regex";

describe("article-body-regex", () => {
  it("【】·() 바이라인을 앞에서 제거한다", () => {
    const raw =
      "【보스턴=홍길동 기자】호치민 교민 커뮤니티가 활발해지고 있다. 정부는 지원을 확대할 예정이다.";
    expect(stripLeadingBylines(raw)).toBe(
      "호치민 교민 커뮤니티가 활발해지고 있다. 정부는 지원을 확대할 예정이다."
    );
  });

  it("끝의 이메일·무단전재 문구를 제거한다", () => {
    const raw =
      "본문 첫 문장입니다. 두 번째 문장도 충분히 깁니다.\n\nabc@news.com\n무단전재 및 재배포 금지";
    expect(stripTrailingBoilerplate(raw)).not.toMatch(/무단전재|abc@news/);
    expect(stripTrailingBoilerplate(raw)).toContain("본문 첫 문장");
  });
});

describe("cleanArticleBody", () => {
  it("[서울=연합뉴스] 한 줄과 본문을 분리한다", () => {
    const raw = `[서울=연합뉴스]

호치민에서 열린 행사에 많은 교민이 참석했다. 현지 언론도 보도했다. 행사는 성황리에 마무리되었다.`;

    const out = cleanArticleBody(raw);
    expect(out).not.toMatch(/연합뉴스/);
    expect(out).toContain("호치민에서 열린 행사");
  });

  it("applyArticleRegexFilters 후 줄 단위 정제가 동작한다", () => {
    const raw = `(호치민=뉴스1) 샘플 리드입니다.

실제 본문 문장입니다. 교민들의 의견이 모였다. 결과는 긍정적으로 평가된다.`;
    const filtered = applyArticleRegexFilters(raw);
    expect(filtered).not.toMatch(/뉴스1\)/);
  });
});
