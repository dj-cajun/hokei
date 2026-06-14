import sanitizeHtmlLib from "sanitize-html";

// jsdom(=isomorphic-dompurify) 대신 순수 JS sanitize-html 사용.
// jsdom은 Next 기본 외부 패키지라 강제 외부 require되며, 그 ESM 전이 의존성
// (@exodus/bytes, @csstools/css-calc 등)이 Vercel 런타임 require()에서 터진다.
// sanitize-html은 번들링되므로 런타임 require(ESM) 문제가 없다.

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "s",
  "del",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "img",
  "h2",
  "h3",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel"];

export function sanitizePostHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
    // javascript: 등 위험 스킴 차단 (data:는 img에만 허용)
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
  });
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function looksLikeHtml(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}
