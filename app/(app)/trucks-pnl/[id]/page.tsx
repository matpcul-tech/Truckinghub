import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusPill from "@/components/loads/status-pill";
import StatCard from "@/components/stat-card";
import { computePnl, defaultDateRange, weeksBetween } from "@/lib/pnl";
import type { Equipment, LoadStatus } from "@/lib/types";

interface EquipmentWithCarrier extends Equipment {
  carriers: { company_name: string; fee_percent: number } | null;
}

interface LoadRow {
  id: string;
  origin_state: string | null;
  dest_state: string | null;
  pickup_date: string | null;
  rate: number;
  rate_per_mile: number;
  loaded_miles: number;
  deadhead_miles: number;
  status: LoadStatus;
  brokers: { name: string } | null;
}

export default async function TruckPnlDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { start?: string; end?: string };
}) {
  const supabase = createClient();
  const defaults = defaultDateRange();
  const start = searchParams.start || defaults.start;
  const end = searchParams.end || defaults.end;
  const weeksInRange = weeksBetween(start, end);

  const { data: equipment } = await supabase
    .from("equipment")
    .select("*, carriers(company_name, fee_percent)")
    .eq("id", params.id)
    .single();

  if (!equipment) {
    notFound();
  }

  const typedEquipment = equipment as unknown as EquipmentWithCarrier;

  const { data: loads } = await supabase
    .from("loads")
    .select("*, brokers(name)")
    .eq("equipment_id", params.id)
    .gte("pickup_date", start)
    .lte("pickup_date", end)
    .order("pickup_date", { ascending: false });

  const loadRows = (loads as unknown as LoadRow[]) || [];

  const revenue = loadRows.reduce((sum, load) => sum + Number(load.rate || 0), 0);
  const loadedMiles = loadRows.reduce(
    (sum, load) => sum + Number(load.loaded_miles || 0),
    0
  );
  const deadheadMiles = loadRows.reduce(
    (sum, load) => sum + Number(load.deadhead_miles || 0),
    0
  );

  const pnl = computePnl({
    revenue,
    loadedMiles,
    deadheadMiles,
    costPerMile: Number(typedEquipment.cost_per_mile || 0),
    fixedCostWeekly: Number(typedEquipment.fixed_cost_weekly || 0),
    feePercent: Number(typedEquipment.carriers?.fee_percent || 0),
    weeksInRange,
  });

  return (
    <div>
      <Link
        href={`/trucks-pnl?start=${start}&end=${end}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        Back to Trucks P&L
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {typedEquipment.unit_number || "Unnumbered unit"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {typedEquipment.carriers?.company_name || "-"}
        {typedEquipment.type ? ` - ${typedEquipment.type}` : ""}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {start} to {end}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={`$${revenue.toLocaleString()}`}
        />
        <StatCard
          label="Net to carrier"
          value={`$${pnl.net.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <StatCard
          label="Deadhead percent"
          value={`${(pnl.deadheadPercent * 100).toFixed(1)}%`}
        />
        <StatCard
          label="Avg rate per mile"
          value={`$${pnl.avgRatePerMile.toFixed(2)}`}
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Cost breakdown
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Total miles</dt>
            <dd className="font-medium text-slate-900">
              {pnl.totalMiles.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Variable cost</dt>
            <dd className="font-medium text-slate-900">
              ${pnl.variableCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Fixed cost</dt>
            <dd className="font-medium text-slate-900">
              ${pnl.fixedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Dispatch fee</dt>
            <dd className="font-medium text-slate-900">
              ${pnl.dispatchFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-6 pb-0">
          <h2 className="text-lg font-semibold text-slate-900">
            Loads behind these numbers
          </h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Lane
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Broker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Pickup
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Rate
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Rate per mile
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loadRows.map((load) => (
              <tr key={load.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600">
                  {load.origin_state || "?"} to {load.dest_state || "?"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {load.brokers?.name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {load.pickup_date || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  ${Number(load.rate).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  ${Number(load.rate_per_mile).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusPill status={load.status} />
                </td>
              </tr>
            ))}
            {loadRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No loads for this truck in this date range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
