/** 인사이드비나·Vietnam.vn·라오동 한국어 미디어 식별 */

export function isInsideVinaSource(url: string, sourceName?: string): boolean {
  if (/insidevina\.com/i.test(url)) return true;
  if (sourceName && /insidevina|인사이드비나/i.test(sourceName)) return true;
  return false;
}

export function isVietnamVnSource(url: string, sourceName?: string): boolean {
  if (/vietnam\.vn/i.test(url)) return true;
  if (sourceName && /vietnam\.vn/i.test(sourceName)) return true;
  return false;
}

export function isLaodongKoSource(url: string, sourceName?: string): boolean {
  if (/ko\.laodong\.vn/i.test(url)) return true;
  if (sourceName && /laodong|라오동/i.test(sourceName)) return true;
  return false;
}

export function isVietnamKoreanMediaArticle(
  url: string,
  title: string,
  sourceName: string
): boolean {
  return (
    isInsideVinaSource(url, sourceName) ||
    isVietnamVnSource(url, sourceName) ||
    isLaodongKoSource(url, sourceName) ||
    /인사이드비나/i.test(title) ||
    /insidevina/i.test(title) ||
    /라오동/i.test(title)
  );
}
