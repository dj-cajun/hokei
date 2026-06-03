export const HOKEI_SOCIAL_EMAIL_DOMAIN = "@users.hokei.local";

/** 소셜 로그인에서 이메일 미동의 시 부여되는 placeholder (기존 카카오 연동 계정 포함) */
export function isSocialPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(HOKEI_SOCIAL_EMAIL_DOMAIN);
}
