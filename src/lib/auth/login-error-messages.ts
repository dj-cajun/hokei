const LOGIN_ERRORS: Record<string, string> = {
  google_csrf:
    "구글 로그인 보안 검증(CSRF)에 실패했습니다. 쿠키 차단을 해제하거나 시크릿 창에서 다시 시도해 주세요.",
  google_no_credential: "구글 인증 정보를 받지 못했습니다.",
  google_token_invalid:
    "구글 토큰 검증에 실패했습니다. Vercel의 NEXT_PUBLIC_GOOGLE_CLIENT_ID가 콘솔 클라이언트 ID와 같은지 확인 후 재배포해 주세요.",
  google_login_failed:
    "구글 로그인 후 서버 처리에 실패했습니다. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.",
  google_session_failed:
    "구글 계정은 확인됐지만 세션을 만들지 못했습니다. AUTH_SECRET이 Vercel에 설정됐는지 확인 후 재배포해 주세요.",
  google_db_error:
    "회원 DB 저장에 실패했습니다. Neon 마이그레이션·User 테이블 스키마를 확인해 주세요.",
  google_db_schema:
    "DB 스키마가 최신이 아닙니다. 서버에서 npm run db:pg:patch 실행 후 다시 시도해 주세요.",
  google_db_config:
    "서버 DB 설정이 맞지 않습니다. Vercel의 DATABASE_URL을 Production·Preview·Development(빌드 포함)에 넣고 재배포해 주세요.",
  google_account_suspended:
    "정지된 계정입니다. 운영자에게 문의해 주세요.",
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
