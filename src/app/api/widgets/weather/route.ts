import { getHoChiMinhWeather } from "@/lib/weather/fetch-weather";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getHoChiMinhWeather();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
