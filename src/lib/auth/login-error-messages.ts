const LOGIN_ERRORS: Record<string, string> = {
  kakao_access_denied: "카카오 로그인을 취소했습니다.",
  kakao_no_code: "카카오 인증 코드를 받지 못했습니다. 다시 시도해 주세요.",
  kakao_signup_disabled:
    "이메일로 먼저 가입해 주세요. 가입한 이메일과 동일한 카카오 계정으로 로그인할 수 있습니다.",
  kakao_email_required:
    "카카오 로그인 시 이메일 제공에 동의해 주세요. 가입한 이메일과 같아야 연동됩니다.",
  kakao_email_conflict:
    "이 이메일은 다른 카카오 계정과 연결되어 있습니다.",
  kakao_complete_failed:
    "카카오 로그인 마무리에 실패했습니다. 다시 시도해 주세요.",
  google_csrf: "구글 로그인 보안 검증에 실패했습니다. 다시 시도해 주세요.",
  google_no_credential: "구글 인증 정보를 받지 못했습니다.",
  google_login_failed: "구글 로그인에 실패했습니다.",
};

export function messageFromLoginErrorParam(code: string | null): string | null {
  if (!code?.trim()) return null;
  const key = decodeURIComponent(code.trim());
  if (LOGIN_ERRORS[key]) return LOGIN_ERRORS[key];
  if (key.startsWith("kakao_")) {
    return "카카오 로그인에 실패했습니다. 개발자 콘솔 Redirect URI를 확인해 주세요.";
  }
  if (key === "kakao_login_failed") {
    return "카카오 로그인에 실패했습니다. KAKAO_REST_API_KEY와 Redirect URI를 확인해 주세요.";
  }
  if (key.startsWith("google_")) {
    return "구글 로그인에 실패했습니다. Google Cloud 콘솔에 Redirect URI를 등록했는지 확인해 주세요.";
  }
  return "로그인에 실패했습니다. 다시 시도해 주세요.";
}
