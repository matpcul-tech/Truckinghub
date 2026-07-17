"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LOAD_STATUSES } from "@/lib/types";
import type { Carrier } from "@/lib/types";

export default function FiltersBar({ carriers }: { carriers: Carrier[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/loads?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={searchParams.get("status") || ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      >
        <option value="">All statuses</option>
        {LOAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status.replace("_", " ")}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("carrier") || ""}
        onChange={(e) => updateParam("carrier", e.target.value)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      >
        <option value="">All carriers</option>
        {carriers.map((carrier) => (
          <option key={carrier.id} value={carrier.id}>
            {carrier.company_name}
          </option>
        ))}
      </select>
    </div>
  );
}
