import { getAdSenseClientId } from "@/lib/ads/adsense-config";

export const dynamic = "force-dynamic";

/** AdSense ads.txt — ca-pub-xxx → pub-xxx */
export async function GET() {
  const client = getAdSenseClientId();
  const pubId = client?.replace(/^ca-/, "") ?? "pub-XXXXXXXXXXXXXXXX";

  const body = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
