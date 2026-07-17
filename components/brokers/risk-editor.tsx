"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RISK_FLAGS, type Broker } from "@/lib/types";

export default function RiskEditor({ broker }: { broker: Broker }) {
  const router = useRouter();
  const [riskFlag, setRiskFlag] = useState(broker.risk_flag);
  const [daysToPay, setDaysToPay] = useState(
    broker.days_to_pay?.toString() || ""
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("brokers")
      .update({
        risk_flag: riskFlag,
        days_to_pay: daysToPay ? Number(daysToPay) : null,
      })
      .eq("id", broker.id);

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Risk screen</h2>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Risk flag
          </label>
          <select
            value={riskFlag}
            onChange={(e) =>
              setRiskFlag(e.target.value as Broker["risk_flag"])
            }
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm capitalize focus:border-slate-500 focus:outline-none"
          >
            {RISK_FLAGS.map((flag) => (
              <option key={flag} value={flag} className="capitalize">
                {flag}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Days to pay
          </label>
          <input
            type="number"
            value={daysToPay}
            onChange={(e) => setDaysToPay(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving" : "Save"}
      </button>
    </div>
  );
}
