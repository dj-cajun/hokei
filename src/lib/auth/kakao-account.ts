import type { Role } from "@/generated/prisma/client";
import type { KakaoProfile } from "@/lib/auth/kakao-oauth";
import { isSocialPlaceholderEmail } from "@/lib/auth/oauth-email";
import { prisma } from "@/lib/prisma";

export type KakaoAuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export class KakaoAccountLinkError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "KakaoAccountLinkError";
    this.code = code;
  }
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
}): KakaoAuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

/**
 * 기존 회원(이메일 가입·이전 카카오 계정)에 카카오 연동 후 로그인.
 * 신규 카카오 전용 가입(계정 없음)은 거부합니다.
 */
export async function findOrLinkUserFromKakao(
  profile: KakaoProfile
): Promise<KakaoAuthUser> {
  const email = profile.email.toLowerCase();
  const { id: kakaoId } = profile;

  const byKakao = await prisma.user.findFirst({
    where: { kakaoId },
  });
  if (byKakao) {
    return toAuthUser(byKakao);
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.kakaoId && user.kakaoId !== kakaoId) {
      throw new KakaoAccountLinkError(
        "이 이메일은 다른 카카오 계정과 연결되어 있습니다.",
        "kakao_email_conflict"
      );
    }
    if (!user.kakaoId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { kakaoId },
      });
    }
    return toAuthUser(user);
  }

  if (isSocialPlaceholderEmail(email)) {
    throw new KakaoAccountLinkError(
      "카카오 이메일 동의가 필요합니다. 카카오 로그인 시 이메일 제공에 동의해 주세요.",
      "kakao_email_required"
    );
  }

  throw new KakaoAccountLinkError(
    "이메일로 먼저 가입한 뒤, 같은 이메일의 카카오 계정으로 로그인할 수 있습니다.",
    "kakao_signup_disabled"
  );
}
