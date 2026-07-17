"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddBrokerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mcNumber, setMcNumber] = useState("");
  const [creditScore, setCreditScore] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("brokers").insert({
      name,
      mc_number: mcNumber || null,
      credit_score: creditScore ? Number(creditScore) : null,
      notes: notes || null,
    });

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setName("");
    setMcNumber("");
    setCreditScore("");
    setNotes("");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="h-fit rounded-lg border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">Add broker</h2>

      <div className="mt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Credit score
          </label>
          <input
            type="number"
            value={creditScore}
            onChange={(e) => setCreditScore(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving" : "Add broker"}
      </button>
    </form>
  );
}
