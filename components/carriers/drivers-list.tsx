"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Driver } from "@/lib/types";

export default function DriversList({
  carrierId,
  drivers,
}: {
  carrierId: string;
  drivers: Driver[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cdlNumber, setCdlNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("drivers").insert({
      carrier_id: carrierId,
      full_name: fullName,
      phone: phone || null,
      cdl_number: cdlNumber || null,
    });

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setFullName("");
    setPhone("");
    setCdlNumber("");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Drivers</h2>

      <ul className="mt-4 divide-y divide-slate-100">
        {drivers.map((driver) => (
          <li key={driver.id} className="py-2 text-sm text-slate-700">
            {driver.full_name}{" "}
            {driver.phone && (
              <span className="text-slate-500">- {driver.phone}</span>
            )}
          </li>
        ))}
        {drivers.length === 0 && (
          <li className="py-2 text-sm text-slate-500">No drivers yet.</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2">
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          value={cdlNumber}
          onChange={(e) => setCdlNumber(e.target.value)}
          placeholder="CDL number"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
