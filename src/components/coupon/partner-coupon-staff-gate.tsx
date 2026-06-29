"use client";

import { useEffect, useState } from "react";
import {
  couponFetch,
  clearStaffSession,
  getStoredStaffSession,
  saveStaffSession,
  type StaffSessionDto,
} from "@/lib/coupon/api";

type StaffRow = { id: string; name: string; role: StaffSessionDto["role"] };

type Props = {
  children: (staff: StaffSessionDto | null) => React.ReactNode;
};

export function PartnerCouponStaffGate({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [required, setRequired] = useState(false);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [staff, setStaff] = useState<StaffSessionDto | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function init() {
      const stored = getStoredStaffSession();
      if (stored) {
        setStaff(stored.staff);
      }

      const req = await couponFetch<{ required: boolean }>("/staff/required", {
        agency: true,
      });
      setRequired(req.required);

      if (req.required) {
        const list = await couponFetch<StaffRow[]>("/staff", { agency: true });
        setStaffList(list);
        if (!selectedId && list[0]) setSelectedId(list[0].id);
      }

      setLoading(false);
    }
    void init();
  }, []);

  async function submitPin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await couponFetch<{
        staffToken: string;
        staff: StaffSessionDto;
      }>("/staff/verify-pin", {
        method: "POST",
        agency: true,
        body: JSON.stringify({ staffId: selectedId, pin }),
      });
      saveStaffSession(res.staffToken, res.staff);
      setStaff(res.staff);
      setPin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "PIN 확인 실패");
    }
  }

  function logoutStaff() {
    clearStaffSession();
    setStaff(null);
    setPin("");
  }

  if (loading) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">직원 세션 확인 중...</p>;
  }

  if (required && !staff) {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-8">
        <h2 className="text-lg font-bold">직원 PIN 로그인</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          스캔·현금 수령 전 직원을 선택하고 PIN을 입력하세요.
        </p>
        <form onSubmit={submitPin} className="mt-6 space-y-4">
          <label className="block text-sm">
            직원
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-light px-3 py-2"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            PIN (4~6자리)
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-lg border border-border-light px-3 py-2 tracking-widest"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button
            type="submit"
            className="min-h-11 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            시작
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {staff ? (
        <div className="flex items-center justify-between border-b border-border-light bg-secondary/50 px-4 py-2 text-xs">
          <span>
            직원: <strong>{staff.name}</strong> ({staff.role})
          </span>
          <button
            type="button"
            onClick={logoutStaff}
            className="text-primary hover:underline"
          >
            직원 변경
          </button>
        </div>
      ) : null}
      {children(staff)}
    </div>
  );
}
