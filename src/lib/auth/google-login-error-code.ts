import { Prisma } from "@/generated/prisma/client";

/** redirect POST 실패 시 URL `login_error` 코드 */
export function googleLoginErrorCodeFromUnknown(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return "google_db_error";
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return "google_db_config";
  }

  if (err instanceof Error) {
    const msg = err.message;
    if (
      msg.includes("Prisma Client") &&
      msg.includes("맞지 않습니다")
    ) {
      return "google_db_config";
    }
    if (
      msg.includes("not compatible with the provider") ||
      msg.includes("DATABASE_URL is not configured")
    ) {
      return "google_db_config";
    }
    if (msg.includes("구글 로그인에 실패")) {
      return "google_session_failed";
    }
  }

  return "google_login_failed";
}
