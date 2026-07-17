import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/stat-card";
import StatusPill from "@/components/loads/status-pill";
import type { LoadStatus } from "@/lib/types";

interface LoadRow {
  id: string;
  origin_state: string | null;
  dest_state: string | null;
  rate: number;
  rate_per_mile: number;
  status: LoadStatus;
  carriers: { company_name: string } | null;
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

export default async function DashboardPage() {
  const supabase = createClient();
  const { start, end } = getWeekRange();

  const [
    { data: activeLoads },
    { data: weekLoads },
    { count: activeCarrierCount },
  ] = await Promise.all([
    supabase.from("loads").select("rate_per_mile").in("status", ACTIVE_STATUSES),
    supabase
      .from("loads")
      .select("*, carriers(company_name)")
      .gte("pickup_date", start)
      .lte("pickup_date", end)
      .order("created_at", { ascending: false }),
    supabase
      .from("carriers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

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
