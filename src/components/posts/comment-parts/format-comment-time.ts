export function formatCommentTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}
