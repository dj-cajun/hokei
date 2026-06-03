import { isLocalDevHost } from "@/lib/auth/local-dev-host";

/** http://localhost 등 — GIS 팝업·iframe이 자주 막히는 환경 */
export function isInsecureLocalDev(): boolean {
  if (typeof window === "undefined") return false;
  return isLocalDevHost() && window.location.protocol === "http:";
}
