export const HOKEI_SOCIAL_EMAIL_DOMAIN = "@users.hokei.local";

/** 카카오·구글 등에서 이메일 미동의 시 부여되는 placeholder */
export function isSocialPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(HOKEI_SOCIAL_EMAIL_DOMAIN);
}
