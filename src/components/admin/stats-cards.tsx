import { Shield, UserPlus, Users } from "lucide-react";

interface StatsCardsProps {
  totalUsers: number;
  adminCount: number;
  todaySignups: number;
}

export function StatsCards({
  totalUsers,
  adminCount,
  todaySignups,
}: StatsCardsProps) {
  const stats = [
    {
      label: "전체 회원",
      value: totalUsers,
      icon: Users,
      color: "text-primary bg-accent",
    },
    {
      label: "관리자",
      value: adminCount,
      icon: Shield,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "오늘 가입",
      value: todaySignups,
      icon: UserPlus,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold">{stat.value}</p>
          </div>
        );
      })}
    </div>
  );
}
