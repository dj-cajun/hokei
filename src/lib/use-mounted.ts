import { useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

/** 클라이언트 마운트 여부 — 하이드레이션 불일치 없이 active 스타일 등에 사용 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}
