"use client";

import { useEffect, useState } from "react";
import {
  couponFetch,
  getStoredStaffSession,
  type StaffSessionDto,
} from "@/lib/coupon/api";
import { COUPON_API_URL } from "@/lib/coupon/config";

type PosDevice = {
  id: string;
  name: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
};

type CreateResponse = {
  device: { id: string; name: string; createdAt: string };
  apiKey: string;
  header: string;
  scanUrl: string;
};

export function PartnerCouponPosPanel() {
  const [staff, setStaff] = useState<StaffSessionDto | null>(null);
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<CreateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const isManager = staff?.role === "manager";

  async function loadDevices() {
    const list = await couponFetch<PosDevice[]>("/pos/devices", { agency: true });
    setDevices(list);
  }

  useEffect(() => {
    setStaff(getStoredStaffSession()?.staff ?? null);
    loadDevices()
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, []);

  async function createDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await couponFetch<CreateResponse>("/pos/devices", {
      method: "POST",
      agency: true,
      body: JSON.stringify({ name: name.trim() }),
    });
    setCreated(res);
    setName("");
    await loadDevices();
  }

  async function revoke(id: string) {
    if (!confirm("이 POS 키를 비활성화할까요?")) return;
    await couponFetch(`/pos/devices/${id}`, { method: "DELETE", agency: true });
    await loadDevices();
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  }

  if (!isManager) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        POS API 키 발급은 <strong>manager</strong> PIN 로그인 후 이용할 수 있습니다.
      </p>
    );
  }

  const apiBase = COUPON_API_URL.replace(/\/$/, "");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border-light bg-secondary/50 p-4 text-sm">
        <p className="font-semibold">외부 POS · 키오스크 연동</p>
        <p className="mt-2 text-muted-foreground">
          발급한 API 키로 coupon API에 직접 스캔 요청을 보냅니다.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-xs">
{`POST ${apiBase}/pos/scan
X-Pos-Api-Key: {발급 키}
{ "qrPayload": "..." }`}
        </pre>
      </div>

      <form onSubmit={createDevice} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="기기 이름 (예: 카운터1)"
          className="min-h-10 flex-1 rounded-lg border border-border-light px-3 text-sm"
        />
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          API 키 발급
        </button>
      </form>

      {created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-bold">새 키 — 한 번만 표시됩니다</p>
          <p className="mt-2 break-all font-mono text-xs">{created.apiKey}</p>
          <p className="mt-2 text-xs">기기: {created.device.name}</p>
        </div>
      ) : null}

      <ul className="space-y-2">
        {devices.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-xl border border-border-light px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.isActive ? "활성" : "비활성"}
                {d.lastUsedAt
                  ? ` · 마지막 사용 ${new Date(d.lastUsedAt).toLocaleString()}`
                  : ""}
              </p>
            </div>
            {d.isActive ? (
              <button
                type="button"
                onClick={() => revoke(d.id)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                비활성화
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
