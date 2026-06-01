import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

/** Sentry 서버 측 에러 전송 테스트 */
export async function GET() {
  if (!process.env.SENTRY_DSN) {
    return Response.json(
      { ok: false, error: "SENTRY_DSN이 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  try {
    throw new Error("Sentry Example API Error");
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({
      ok: true,
      message: "에러를 Sentry에 보고했습니다. Issues 탭에서 확인하세요.",
    });
  }
}
