"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EQUIPMENT_TYPES, type LaneBenchmark } from "@/lib/types";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export default function BenchmarksTable({
  benchmarks,
}: {
  benchmarks: LaneBenchmark[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [originState, setOriginState] = useState("");
  const [destState, setDestState] = useState("");
  const [equipmentType, setEquipmentType] = useState(EQUIPMENT_TYPES[0]);
  const [benchmarkRpm, setBenchmarkRpm] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("lane_benchmarks").upsert(
      {
        origin_state: originState,
        dest_state: destState,
        equipment_type: equipmentType,
        benchmark_rpm: Number(benchmarkRpm),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "origin_state,dest_state,equipment_type" }
    );

    setAdding(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setOriginState("");
    setDestState("");
    setBenchmarkRpm("");
    router.refresh();
  }

  async function handleUpdate(benchmark: LaneBenchmark) {
    const value = editing[benchmark.id];
    if (value === undefined) return;

    setSavingId(benchmark.id);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("lane_benchmarks")
      .update({ benchmark_rpm: Number(value), updated_at: new Date().toISOString() })
      .eq("id", benchmark.id);

    setSavingId(null);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setEditing((prev) => {
      const next = { ...prev };
      delete next[benchmark.id];
      return next;
    });
    router.refresh();
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Origin state
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Dest state
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Equipment type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Benchmark rate per mile
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {benchmarks.map((benchmark) => (
              <tr key={benchmark.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">
                  {benchmark.origin_state}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {benchmark.dest_state}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {benchmark.equipment_type}
                </td>
                <td className="px-4 py-3 text-sm">
                  <input
                    type="number"
                    step="0.01"
                    value={
                      editing[benchmark.id] ?? String(benchmark.benchmark_rpm)
                    }
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        [benchmark.id]: e.target.value,
                      }))
                    }
                    className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3 text-sm">
                  <button
                    onClick={() => handleUpdate(benchmark)}
                    disabled={
                      savingId === benchmark.id ||
                      editing[benchmark.id] === undefined
                    }
                    className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Save
                  </button>
                </td>
              </tr>
            ))}
            {benchmarks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No benchmarks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={handleAdd}
        className="mt-6 max-w-xl rounded-lg border border-slate-200 bg-white p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          Add lane benchmark
        </h2>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Origin state
            </label>
            <select
              required
              value={originState}
              onChange={(e) => setOriginState(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Dest state
            </label>
            <select
              required
              value={destState}
              onChange={(e) => setDestState(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Equipment type
            </label>
            <select
              value={equipmentType}
              onChange={(e) => setEquipmentType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {EQUIPMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Benchmark rate per mile
            </label>
            <input
              required
              type="number"
              step="0.01"
              value={benchmarkRpm}
              onChange={(e) => setBenchmarkRpm(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {errorMessage && (
          <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={adding}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {adding ? "Saving" : "Add benchmark"}
        </button>
      </form>
    </div>
  );
}
