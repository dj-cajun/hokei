/** 네이버·국내 언론사 도메인 (originallink·RSS 링크) */

const KOREAN_PUBLISHER_HOST =
  /(?:^|\/\/)(?:www\.|m\.|n\.)?(?:news\.naver\.com|n\.news\.naver\.com|chosun\.com|joongang\.co\.kr|hani\.co\.kr|mk\.co\.kr|hankyung\.com|yna\.co\.kr|news1\.kr|kbs\.co\.kr|sbs\.co\.kr|imaeil\.com|seoul\.co\.kr|khan\.co\.kr|edaily\.co\.kr|mt\.co\.kr|fnnews\.com|sedaily\.com|dt\.co\.kr|busan\.com|viva100\.com)/i;

export function isKoreanPublisherArticleLink(link?: string): boolean {
  if (!link?.startsWith("http")) return false;
  return KOREAN_PUBLISHER_HOST.test(link);
}
