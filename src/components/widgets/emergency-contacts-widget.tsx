import { Phone } from "lucide-react";

const contacts = [
  {
    label: "주베트남 대한민국 총영사관",
    sub: "Ho Chi Minh City",
    tel: "+842838220357",
    display: "+84-28-3822-0357",
  },
  {
    label: "베트남 경찰",
    sub: "Emergency",
    tel: "113",
    display: "113",
  },
  {
    label: "베트남 응급의료",
    sub: "Ambulance",
    tel: "115",
    display: "115",
  },
  {
    label: "베트남 소방",
    sub: "Fire",
    tel: "114",
    display: "114",
  },
] as const;

export function EmergencyContactsWidget() {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-red-600" aria-hidden />
        <h3 className="text-sm font-semibold text-foreground">긴급 연락처</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {contacts.map((c) => (
          <li key={c.tel}>
            <a
              href={`tel:${c.tel}`}
              className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 transition-colors hover:bg-card-hover"
            >
              <span>
                <span className="block text-xs font-medium">{c.label}</span>
                <span className="text-[10px] text-muted-foreground">{c.sub}</span>
              </span>
              <span className="text-sm font-semibold text-primary">{c.display}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
