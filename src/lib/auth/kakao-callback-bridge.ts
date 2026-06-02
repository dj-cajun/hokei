/** GET 콜백 → POST 완료(세션 쿠키) — fetch로 빠르게 마무리 */
export function kakaoCallbackBridgeHtml(params: {
  code: string;
  redirectUri: string;
  callbackUrl: string;
}): string {
  const payload = JSON.stringify({
    code: params.code,
    redirectUri: params.redirectUri,
    callbackUrl: params.callbackUrl,
  });

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>로그인 처리 중…</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; min-height: 100dvh; align-items: center; justify-content: center; margin: 0; color: #334155; background: #fff; }
  </style>
</head>
<body>
  <p>잠시만 기다려 주세요…</p>
  <script>
  (async function () {
    var fail = "/?login_error=kakao_complete_failed";
    try {
      var res = await fetch("/api/auth/kakao/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        redirect: "manual",
        body: ${JSON.stringify(payload)}
      });
      if (res.status >= 300 && res.status < 400) {
        var loc = res.headers.get("Location");
        if (loc) { window.location.replace(loc); return; }
      }
      if (!res.ok) { window.location.replace(fail); return; }
      window.location.replace(${JSON.stringify(params.callbackUrl)});
    } catch (e) {
      window.location.replace(fail);
    }
  })();
  </script>
</body>
</html>`;
}
