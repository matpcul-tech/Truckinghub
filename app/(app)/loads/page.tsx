import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatusPill from "@/components/loads/status-pill";
import StatusControl from "@/components/loads/status-control";
import FiltersBar from "@/components/loads/filters-bar";
import type { Carrier, LoadStatus } from "@/lib/types";

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
}

export default async function LoadsPage({
  searchParams,
}: {
  searchParams: { status?: string; carrier?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("loads")
    .select("*, carriers(company_name), brokers(name)")
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.carrier) {
    query = query.eq("carrier_id", searchParams.carrier);
  }

  const [{ data: loads }, { data: carriers }] = await Promise.all([
    query,
    supabase
      .from("carriers")
      .select("*")
      .order("company_name", { ascending: true }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Loads</h1>
        <Link
          href="/loads/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add load
        </Link>
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
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(loads as unknown as LoadRow[] | null)?.map((load) => (
              <tr key={load.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {load.carriers?.company_name || "-"}
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
                  <div className="flex items-center gap-2">
                    <StatusPill status={load.status} />
                    <StatusControl loadId={load.id} status={load.status} />
                  </div>
                </td>
              </tr>
            ))}
            {(!loads || loads.length === 0) && (
              <tr>
                <td
                  colSpan={7}
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
