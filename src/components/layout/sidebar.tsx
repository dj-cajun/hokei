import { CategoryMenu } from "@/components/sidebar/category-menu";
import { ExchangeWidget } from "@/components/sidebar/exchange-widget";
import { LoginBox } from "@/components/sidebar/login-box";
import { WeatherWidget } from "@/components/sidebar/weather-widget";
import { EmergencyContactsWidget } from "@/components/widgets/emergency-contacts-widget";

export function Sidebar() {
  return (
    <aside className="hidden w-[260px] shrink-0 lg:block">
      <div className="sticky top-20 flex flex-col gap-3">
        <LoginBox />
        <CategoryMenu />
        <WeatherWidget />
        <ExchangeWidget />
        <EmergencyContactsWidget />
      </div>
    </aside>
  );
}
