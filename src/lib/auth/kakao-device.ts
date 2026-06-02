/**
 * 카카오톡 앱 연동(throughTalk) — 모바일 일반 브라우저에서만 사용.
 * PC·인앱 브라우저에서는 false → 카카오계정 웹 로그인(동일 버튼, 안정 동작).
 */
export function shouldPreferKakaoTalk(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return false;

  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  if (!mobile) return false;

  // 카카오톡·인스타·페이스북 등 인앱 브라우저는 딥링크가 깨지는 경우가 많음
  if (/KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER|DaumApps/i.test(ua)) {
    return false;
  }

  return true;
}
