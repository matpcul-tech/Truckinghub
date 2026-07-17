import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PnlFilters from "@/components/pnl/pnl-filters";
import { computePnl, defaultDateRange, weeksBetween } from "@/lib/pnl";
import type { Carrier, Equipment } from "@/lib/types";

interface EquipmentWithCarrier extends Equipment {
  carriers: { company_name: string; fee_percent: number } | null;
}

interface LoadForPnl {
  equipment_id: string | null;
  rate: number;
  loaded_miles: number;
  deadhead_miles: number;
}

export default async function TrucksPnlPage({
  searchParams,
}: {
  searchParams: { start?: string; end?: string; carrier?: string };
}) {
  const supabase = createClient();
  const defaults = defaultDateRange();
  const start = searchParams.start || defaults.start;
  const end = searchParams.end || defaults.end;
  const weeksInRange = weeksBetween(start, end);

  const { data: carriers } = await supabase
    .from("carriers")
    .select("*")
    .order("company_name", { ascending: true });

  let equipmentQuery = supabase
    .from("equipment")
    .select("*, carriers(company_name, fee_percent)")
    .order("unit_number", { ascending: true });

  if (searchParams.carrier) {
    equipmentQuery = equipmentQuery.eq("carrier_id", searchParams.carrier);
  }

  const { data: equipment } = await equipmentQuery;
  const equipmentList = (equipment as unknown as EquipmentWithCarrier[]) || [];
  const equipmentIds = equipmentList.map((item) => item.id);

  let loads: LoadForPnl[] = [];
  if (equipmentIds.length > 0) {
    const { data: loadData } = await supabase
      .from("loads")
      .select("equipment_id, rate, loaded_miles, deadhead_miles")
      .in("equipment_id", equipmentIds)
      .gte("pickup_date", start)
      .lte("pickup_date", end);
    loads = (loadData as LoadForPnl[]) || [];
  }

  const rows = equipmentList.map((item) => {
    const equipmentLoads = loads.filter(
      (load) => load.equipment_id === item.id
    );
    const revenue = equipmentLoads.reduce(
      (sum, load) => sum + Number(load.rate || 0),
      0
    );
    const loadedMiles = equipmentLoads.reduce(
      (sum, load) => sum + Number(load.loaded_miles || 0),
      0
    );
    const deadheadMiles = equipmentLoads.reduce(
      (sum, load) => sum + Number(load.deadhead_miles || 0),
      0
    );

    const pnl = computePnl({
      revenue,
      loadedMiles,
      deadheadMiles,
      costPerMile: Number(item.cost_per_mile || 0),
      fixedCostWeekly: Number(item.fixed_cost_weekly || 0),
      feePercent: Number(item.carriers?.fee_percent || 0),
      weeksInRange,
    });

    return { equipment: item, pnl };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.pnl.revenue,
      totalMiles: acc.totalMiles + row.pnl.totalMiles,
      variableCost: acc.variableCost + row.pnl.variableCost,
      fixedCost: acc.fixedCost + row.pnl.fixedCost,
      dispatchFee: acc.dispatchFee + row.pnl.dispatchFee,
      net: acc.net + row.pnl.net,
      deadheadMiles:
        acc.deadheadMiles +
        row.pnl.totalMiles * row.pnl.deadheadPercent,
      loadedMilesForRate:
        acc.loadedMilesForRate +
        (row.pnl.avgRatePerMile > 0
          ? row.pnl.revenue / row.pnl.avgRatePerMile
          : 0),
    }),
    {
      revenue: 0,
      totalMiles: 0,
      variableCost: 0,
      fixedCost: 0,
      dispatchFee: 0,
      net: 0,
      deadheadMiles: 0,
      loadedMilesForRate: 0,
    }
  );

  const totalsDeadheadPercent =
    totals.totalMiles > 0 ? totals.deadheadMiles / totals.totalMiles : 0;
  const totalsAvgRatePerMile =
    totals.loadedMilesForRate > 0
      ? totals.revenue / totals.loadedMilesForRate
      : 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Trucks P&L</h1>
      <p className="mt-1 text-sm text-slate-500">
        Revenue, cost, and net to carrier per truck for the selected date
        range. This is a report only, it does not move money.
      </p>

      <div className="mt-4">
        <PnlFilters
          carriers={(carriers as Carrier[]) || []}
          start={start}
          end={end}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Truck
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Carrier
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Revenue
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Total miles
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Deadhead %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Avg rate/mile
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Variable cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Fixed cost
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Dispatch fee
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                Net to carrier
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ equipment: item, pnl }) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  <Link
                    href={`/trucks-pnl/${item.id}?start=${start}&end=${end}`}
                    className="hover:underline"
                  >
                    {item.unit_number || "Unnumbered unit"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {item.carriers?.company_name || "-"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  ${pnl.revenue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {pnl.totalMiles.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {(pnl.deadheadPercent * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  ${pnl.avgRatePerMile.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  ${pnl.variableCost.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  ${pnl.fixedCost.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  ${pnl.dispatchFee.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm font-medium ${
                    pnl.net >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  ${pnl.net.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No trucks yet.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="bg-slate-50">
              <tr>
                <td
                  className="px-4 py-3 text-sm font-semibold text-slate-900"
                  colSpan={2}
                >
                  Totals
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  ${totals.revenue.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {totals.totalMiles.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {(totalsDeadheadPercent * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  ${totalsAvgRatePerMile.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  ${totals.variableCost.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  ${totals.fixedCost.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  ${totals.dispatchFee.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td
                  className={`px-4 py-3 text-right text-sm font-semibold ${
                    totals.net >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  ${totals.net.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
