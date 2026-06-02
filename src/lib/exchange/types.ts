export type ExchangeSnapshot = {
  /** 1 KRW당 VND */
  vndPerKrw: number;
  updatedAt: string;
  source: "api" | "fallback";
};
