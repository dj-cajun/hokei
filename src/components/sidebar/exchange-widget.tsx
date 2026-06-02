import { getExchangeRate } from "@/lib/exchange/fetch-rate";
import {
  ExchangeDisplay,
  ExchangeDisplayHeader,
} from "@/components/widgets/exchange-display";

export async function ExchangeWidget() {
  const data = await getExchangeRate();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <ExchangeDisplayHeader />
      <ExchangeDisplay data={data} />
    </div>
  );
}
