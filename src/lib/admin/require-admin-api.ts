import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";

export async function requireAdminApi() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { session: null, error: apiError("권한이 없습니다.", 403) };
  }
  return { session, error: null as null };
}
