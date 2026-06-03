const LOGIN_ERRORS: Record<string, string> = {
  google_csrf: "구글 로그인 보안 검증에 실패했습니다. 다시 시도해 주세요.",
  google_no_credential: "구글 인증 정보를 받지 못했습니다.",
  google_login_failed: "구글 로그인에 실패했습니다.",
};

export function messageFromLoginErrorParam(code: string | null): string | null {
  if (!code?.trim()) return null;
  const key = decodeURIComponent(code.trim());
  if (LOGIN_ERRORS[key]) return LOGIN_ERRORS[key];
  if (key.startsWith("google_")) {
    return "구글 로그인에 실패했습니다. Google Cloud 콘솔에 Redirect URI를 등록했는지 확인해 주세요.";
  }
  return "로그인에 실패했습니다. 다시 시도해 주세요.";
}
