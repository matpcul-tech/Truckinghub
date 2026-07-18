"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewCarrierPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [dotNumber, setDotNumber] = useState("");
  const [feePercent, setFeePercent] = useState("6.0");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("carriers")
      .insert({
        company_name: companyName,
        mc_number: mcNumber || null,
        dot_number: dotNumber || null,
        fee_percent: feePercent ? Number(feePercent) : 6.0,
        status: "pending",
        assigned_dispatcher: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      setSaving(false);
      setErrorMessage(error.message);
      return;
    }

    router.push(`/carriers/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-slate-900">Add carrier</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Company name
          </label>
          <input
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            MC number
          </label>
          <input
            value={mcNumber}
            onChange={(e) => setMcNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            DOT number
          </label>
          <input
            value={dotNumber}
            onChange={(e) => setDotNumber(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Fee percent
          </label>
          <input
            type="number"
            step="0.1"
            value={feePercent}
            onChange={(e) => setFeePercent(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving" : "Save carrier"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/carriers")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
