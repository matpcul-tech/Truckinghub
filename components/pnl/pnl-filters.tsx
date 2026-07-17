"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Carrier } from "@/lib/types";

export default function PnlFilters({
  carriers,
  start,
  end,
}: {
  carriers: Carrier[];
  start: string;
  end: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/trucks-pnl?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500">
          Start date
        </label>
        <input
          type="date"
          value={start}
          onChange={(e) => updateParam("start", e.target.value)}
          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">
          End date
        </label>
        <input
          type="date"
          value={end}
          onChange={(e) => updateParam("end", e.target.value)}
          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500">
          Carrier
        </label>
        <select
          value={searchParams.get("carrier") || ""}
          onChange={(e) => updateParam("carrier", e.target.value)}
          className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="">All carriers</option>
          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.company_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
