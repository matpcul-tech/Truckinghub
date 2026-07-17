"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Equipment } from "@/lib/types";

export default function EquipmentList({
  carrierId,
  equipment,
}: {
  carrierId: string;
  equipment: Equipment[];
}) {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState("");
  const [type, setType] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("equipment").insert({
      carrier_id: carrierId,
      unit_number: unitNumber || null,
      type: type || null,
    });

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setUnitNumber("");
    setType("");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Equipment</h2>

      <ul className="mt-4 divide-y divide-slate-100">
        {equipment.map((item) => (
          <li key={item.id} className="py-2 text-sm text-slate-700">
            {item.unit_number || "Unnumbered unit"}{" "}
            {item.type && (
              <span className="text-slate-500">- {item.type}</span>
            )}
          </li>
        ))}
        {equipment.length === 0 && (
          <li className="py-2 text-sm text-slate-500">No equipment yet.</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap gap-2">
        <input
          value={unitNumber}
          onChange={(e) => setUnitNumber(e.target.value)}
          placeholder="Unit number"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Type (truck, dry van, reefer)"
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
