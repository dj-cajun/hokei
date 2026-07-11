export class CouponApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "CouponApiError";
  }
}

export function isCouponApiError(err: unknown): err is CouponApiError {
  return err instanceof CouponApiError;
}
