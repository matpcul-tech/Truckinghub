"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EQUIPMENT_TYPES, type Equipment } from "@/lib/types";

function EquipmentRow({ item }: { item: Equipment }) {
  const router = useRouter();
  const [fixedCostWeekly, setFixedCostWeekly] = useState(
    String(item.fixed_cost_weekly ?? 0)
  );
  const [costPerMile, setCostPerMile] = useState(
    String(item.cost_per_mile ?? 0)
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("equipment")
      .update({
        fixed_cost_weekly: Number(fixedCostWeekly) || 0,
        cost_per_mile: Number(costPerMile) || 0,
      })
      .eq("id", item.id);

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <li className="py-3">
      <div className="text-sm text-slate-700">
        {item.unit_number || "Unnumbered unit"}{" "}
        {item.type && <span className="text-slate-500">- {item.type}</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500">
          Fixed cost/week
          <input
            type="number"
            step="0.01"
            value={fixedCostWeekly}
            onChange={(e) => setFixedCostWeekly(e.target.value)}
            className="ml-1 w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>
        <label className="text-xs text-slate-500">
          Cost/mile
          <input
            type="number"
            step="0.01"
            value={costPerMile}
            onChange={(e) => setCostPerMile(e.target.value)}
            className="ml-1 w-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}
    </li>
  );
}

export default function EquipmentList({
  carrierId,
  equipment,
}: {
  carrierId: string;
  equipment: Equipment[];
}) {
  const router = useRouter();
  const [unitNumber, setUnitNumber] = useState("");
  const [type, setType] = useState(EQUIPMENT_TYPES[0]);
  const [fixedCostWeekly, setFixedCostWeekly] = useState("0");
  const [costPerMile, setCostPerMile] = useState("0");
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
      fixed_cost_weekly: Number(fixedCostWeekly) || 0,
      cost_per_mile: Number(costPerMile) || 0,
    });

    setSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setUnitNumber("");
    setType(EQUIPMENT_TYPES[0]);
    setFixedCostWeekly("0");
    setCostPerMile("0");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Equipment</h2>

      <ul className="mt-4 divide-y divide-slate-100">
        {equipment.map((item) => (
          <EquipmentRow key={item.id} item={item} />
        ))}
        {equipment.length === 0 && (
          <li className="py-2 text-sm text-slate-500">No equipment yet.</li>
        )}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-2">
          <input
            value={unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="Unit number"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            {EQUIPMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex-1 text-xs text-slate-500">
            Fixed cost per week (truck payment, insurance)
            <input
              type="number"
              step="0.01"
              value={fixedCostWeekly}
              onChange={(e) => setFixedCostWeekly(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
          <label className="flex-1 text-xs text-slate-500">
            Cost per mile (fuel, maintenance)
            <input
              type="number"
              step="0.01"
              value={costPerMile}
              onChange={(e) => setCostPerMile(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Add equipment
        </button>
      </form>
      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
