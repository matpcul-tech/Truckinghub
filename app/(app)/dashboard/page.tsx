import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isOwner } from "@/lib/profile";
import StatCard from "@/components/stat-card";
import StatusPill from "@/components/loads/status-pill";
import ScopeToggle from "@/components/scope-toggle";
import type { LoadStatus, Profile } from "@/lib/types";

interface LoadRow {
  id: string;
  origin_state: string | null;
  dest_state: string | null;
  rate: number;
  rate_per_mile: number;
  status: LoadStatus;
  carriers: { company_name: string } | null;
}

interface BreakdownLoad {
  rate: number;
  rate_per_mile: number;
  loaded_miles: number;
  deadhead_miles: number;
  carriers: { assigned_dispatcher: string | null } | null;
}

const ACTIVE_STATUSES: LoadStatus[] = ["booked", "dispatched", "in_transit"];

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - dayOfWeek);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toISODate = (d: Date) => d.toISOString().split("T")[0];
  return { start: toISODate(start), end: toISODate(end) };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { scope?: string };
}) {
  const supabase = createClient();
  const { start, end } = getWeekRange();
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);
  const scope = owner && searchParams.scope === "mine" ? "mine" : "all";

  let carrierIdsForScope: string[] | null = null;
  if (scope === "mine" && profile) {
    const { data: myCarriers } = await supabase
      .from("carriers")
      .select("id")
      .eq("assigned_dispatcher", profile.id);
    carrierIdsForScope = (myCarriers || []).map((c) => c.id);
  }

  let activeLoadsQuery = supabase
    .from("loads")
    .select("rate_per_mile")
    .in("status", ACTIVE_STATUSES);
  let weekLoadsQuery = supabase
    .from("loads")
    .select("*, carriers(company_name)")
    .gte("pickup_date", start)
    .lte("pickup_date", end)
    .order("created_at", { ascending: false });
  let activeCarrierQuery = supabase
    .from("carriers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  if (carrierIdsForScope) {
    activeLoadsQuery = activeLoadsQuery.in("carrier_id", carrierIdsForScope);
    weekLoadsQuery = weekLoadsQuery.in("carrier_id", carrierIdsForScope);
    activeCarrierQuery = activeCarrierQuery.in("id", carrierIdsForScope);
  }

  const [{ data: activeLoads }, { data: weekLoads }, { count: activeCarrierCount }] =
    await Promise.all([activeLoadsQuery, weekLoadsQuery, activeCarrierQuery]);

  const activeLoadsCount = activeLoads?.length || 0;

  const revenueThisWeek = (weekLoads || []).reduce(
    (sum, load) => sum + Number(load.rate || 0),
    0
  );

  const avgRatePerMile =
    activeLoads && activeLoads.length > 0
      ? activeLoads.reduce((sum, l) => sum + Number(l.rate_per_mile || 0), 0) /
        activeLoads.length
      : 0;

  let breakdownRows: {
    dispatcherId: string;
    dispatcherName: string;
    loadsCount: number;
    revenue: number;
    avgRatePerMile: number;
    deadheadPercent: number;
  }[] = [];

  if (owner && scope === "all") {
    const [{ data: allLoads }, { data: allProfiles }] = await Promise.all([
      supabase
        .from("loads")
        .select("rate, rate_per_mile, loaded_miles, deadhead_miles, carriers(assigned_dispatcher)"),
      supabase.from("profiles").select("*"),
    ]);

    const profileById = new Map(
      ((allProfiles as Profile[]) || []).map((p) => [p.id, p])
    );

    const groups = new Map<
      string,
      { loadsCount: number; revenue: number; rateSum: number; loadedMiles: number; deadheadMiles: number }
    >();

    for (const load of (allLoads as unknown as BreakdownLoad[]) || []) {
      const key = load.carriers?.assigned_dispatcher || "unassigned";
      const group = groups.get(key) || {
        loadsCount: 0,
        revenue: 0,
        rateSum: 0,
        loadedMiles: 0,
        deadheadMiles: 0,
      };
      group.loadsCount += 1;
      group.revenue += Number(load.rate || 0);
      group.rateSum += Number(load.rate_per_mile || 0);
      group.loadedMiles += Number(load.loaded_miles || 0);
      group.deadheadMiles += Number(load.deadhead_miles || 0);
      groups.set(key, group);
    }

    breakdownRows = Array.from(groups.entries()).map(([dispatcherId, group]) => {
      const totalMiles = group.loadedMiles + group.deadheadMiles;
      return {
        dispatcherId,
        dispatcherName:
          dispatcherId === "unassigned"
            ? "Unassigned"
            : profileById.get(dispatcherId)?.full_name || dispatcherId,
        loadsCount: group.loadsCount,
        revenue: group.revenue,
        avgRatePerMile: group.loadsCount > 0 ? group.rateSum / group.loadsCount : 0,
        deadheadPercent: totalMiles > 0 ? group.deadheadMiles / totalMiles : 0,
      };
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        {owner && <ScopeToggle basePath="/dashboard" />}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active loads" value={String(activeLoadsCount)} />
        <StatCard
          label="Revenue this week"
          value={`$${revenueThisWeek.toLocaleString()}`}
        />
        <StatCard
          label="Avg rate per mile (active)"
          value={`$${avgRatePerMile.toFixed(2)}`}
        />
        <StatCard
          label="Active carriers"
          value={String(activeCarrierCount || 0)}
        />
      </div>

      {owner && scope === "all" && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">
            Dispatcher breakdown
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Dispatcher
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Loads
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Avg rate per mile
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                    Deadhead percent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {breakdownRows.map((row) => (
                  <tr key={row.dispatcherId}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {row.dispatcherName}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {row.loadsCount}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      ${row.revenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      ${row.avgRatePerMile.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {(row.deadheadPercent * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
                {breakdownRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No loads yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          This week&apos;s loads
        </h2>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lane
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Carrier
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
              {(weekLoads as unknown as LoadRow[] | null)?.map((load) => (
                <tr key={load.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {load.origin_state || "?"} to {load.dest_state || "?"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {load.carriers?.company_name || "-"}
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
              {(!weekLoads || weekLoads.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No loads this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
