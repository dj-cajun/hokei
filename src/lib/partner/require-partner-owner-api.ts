import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";
import { getPartnerStoreByOwnerId } from "@/lib/partner/queries";

export async function requirePartnerOwnerApi() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      store: null,
      error: apiError("로그인이 필요합니다.", 401),
    };
  }

  const store = await getPartnerStoreByOwnerId(session.user.id);
  if (!store) {
    return {
      session,
      store: null,
      error: apiError("등록된 제휴 업소가 없습니다.", 404),
    };
  }

  return { session, store, error: null as null };
}
