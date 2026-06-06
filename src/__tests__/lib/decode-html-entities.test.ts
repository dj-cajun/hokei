import { describe, expect, it } from "vitest";
import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";

describe("decodeHtmlEntities", () => {
  it("decodes hex numeric entities", () => {
    expect(decodeHtmlEntities("it&#x27;s")).toBe("it's");
    expect(decodeHtmlEntities("A &amp; B &#x2F; C")).toBe("A & B / C");
  });

  it("decodes decimal numeric entities", () => {
    expect(decodeHtmlEntities("it&#39;s")).toBe("it's");
    expect(decodeHtmlEntities("&#8216;인용&#8217;")).toBe("\u2018인용\u2019");
  });

  it("decodes named entities", () => {
    expect(decodeHtmlEntities("&quot;호치민&quot; &amp; &lt;test&gt;")).toBe(
      '"호치민" & <test>'
    );
    expect(decodeHtmlEntities("space&nbsp;here")).toBe("space here");
  });

  it("leaves unknown entities unchanged", () => {
    expect(decodeHtmlEntities("&unknown;")).toBe("&unknown;");
  });
});
