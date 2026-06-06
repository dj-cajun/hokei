import { getAdSenseClientId } from "@/lib/ads/adsense-config";

export const dynamic = "force-dynamic";

/** AdSense ads.txt — ca-pub-xxx → pub-xxx (미설정 시 404) */
export async function GET() {
  const client = getAdSenseClientId();
  if (!client) {
    return new Response("Not configured", { status: 404 });
  }

  const pubId = client.replace(/^ca-/, "");
  const body = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
