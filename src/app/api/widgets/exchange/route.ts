import { getExchangeRate } from "@/lib/exchange/fetch-rate";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getExchangeRate();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
