import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isOwner } from "@/lib/profile";
import StatusPill from "@/components/loads/status-pill";
import StatusControl from "@/components/loads/status-control";
import ScorePill from "@/components/loads/score-pill";
import FiltersBar from "@/components/loads/filters-bar";
import ScopeToggle from "@/components/scope-toggle";
import { findBenchmark, scoreLoad } from "@/lib/scoring";
import type { Carrier, LaneBenchmark, LoadStatus } from "@/lib/types";

interface LoadRow {
  id: string;
  origin_state: string | null;
  dest_state: string | null;
  pickup_date: string | null;
  rate: number;
  rate_per_mile: number;
  status: LoadStatus;
  carriers: { company_name: string } | null;
  brokers: { name: string } | null;
  equipment: { type: string | null } | null;
}

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: { status?: string; carrier?: string; scope?: string };
}) {
  const supabase = createClient();
  const profile = await getCurrentProfile();
  const owner = isOwner(profile);
  const scope = owner && searchParams.scope === "mine" ? "mine" : "all";

  let query = supabase
    .from("loads")
    .select("*, carriers(company_name), brokers(name), equipment(type)")
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.carrier) {
    query = query.eq("carrier_id", searchParams.carrier);
  }
  if (scope === "mine" && profile) {
    const { data: myCarriers } = await supabase
      .from("carriers")
      .select("id")
      .eq("assigned_dispatcher", profile.id);
    query = query.in("carrier_id", (myCarriers || []).map((c) => c.id));
  }

  const [{ data: loads }, { data: carriers }, { data: benchmarks }, { data: podDocs }] =
    await Promise.all([
      query,
      supabase
        .from("carriers")
        .select("*")
        .order("company_name", { ascending: true }),
      supabase.from("lane_benchmarks").select("*"),
      supabase.from("documents").select("load_id").eq("kind", "pod"),
    ]);

  const benchmarkList = (benchmarks as LaneBenchmark[]) || [];
  const podLoadIds = new Set(
    (podDocs || []).map((doc) => doc.load_id).filter(Boolean)
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Loads</h1>
        <div className="flex items-center gap-3">
          {owner && <ScopeToggle basePath="/loads" />}
          <Link
            href="/loads/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add load
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <FiltersBar carriers={(carriers as Carrier[]) || []} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Carrier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Broker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Lane
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
                Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(loads as unknown as LoadRow[] | null)?.map((load) => {
              const benchmark = findBenchmark(
                benchmarkList,
                load.origin_state,
                load.dest_state,
                load.equipment?.type || null
              );
              const score = scoreLoad(Number(load.rate_per_mile), benchmark);

              return (
                <tr key={load.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    <Link
                      href={`/loads/${load.id}`}
                      className="hover:underline"
                    >
                      {load.carriers?.company_name || "-"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {load.brokers?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {load.origin_state || "?"} to {load.dest_state || "?"}
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
                    <ScorePill score={score} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={load.status} />
                      <StatusControl loadId={load.id} status={load.status} />
                      {podLoadIds.has(load.id) && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                          POD
                        </span>
                      )}
                      {load.status === "delivered" && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Ready to invoice
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!loads || loads.length === 0) && (
              <tr>
                <td
                  colSpan={8}
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
  );
}
