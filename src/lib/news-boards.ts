/** @deprecated — 보드 필터 제거. `/news/*` DB 카테고리 사용 */
export type { NewsBoardSlug } from "@/lib/news-boards-config";
export {
  getNewsBoardRedirect,
  isNewsSectionPath,
  NEWS_BOARD_REDIRECTS,
} from "@/lib/news-boards-config";
