import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RiskBadge from "@/components/brokers/risk-badge";
import RiskEditor from "@/components/brokers/risk-editor";
import StatusPill from "@/components/loads/status-pill";
import { saferLookupUrl } from "@/lib/safer";
import type { Broker, LoadStatus } from "@/lib/types";

interface BrokerLoadRow {
  id: string;
  origin_state: string | null;
  dest_state: string | null;
  pickup_date: string | null;
  rate: number;
  status: LoadStatus;
  carriers: { company_name: string } | null;
}

export default async function BrokerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: broker } = await supabase
    .from("brokers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!broker) {
    notFound();
  }

  const typedBroker = broker as Broker;

  const { data: loads } = await supabase
    .from("loads")
    .select("*, carriers(company_name)")
    .eq("broker_id", params.id)
    .order("created_at", { ascending: false });

  const loadRows = (loads as unknown as BrokerLoadRow[]) || [];
  const totalRevenue = loadRows.reduce(
    (sum, load) => sum + Number(load.rate || 0),
    0
  );

  return (
    <div>
      <Link
        href="/brokers"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        Back to brokers
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {typedBroker.name}
        </h1>
        <RiskBadge risk={typedBroker.risk_flag} />
      </div>

      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
        {typedBroker.mc_number ? (
          <>
            <span>MC {typedBroker.mc_number}</span>
            <a
              href={saferLookupUrl(typedBroker.mc_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Look up on SAFER
            </a>
          </>
        ) : (
          <span>No MC number on file</span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Loads with this broker
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Total revenue: ${totalRevenue.toLocaleString()}
            </p>

            <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Lane
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Carrier
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Rate
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadRows.map((load) => (
                    <tr key={load.id}>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {load.origin_state || "?"} to {load.dest_state || "?"}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-900">
                        {load.carriers?.company_name || "-"}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        ${Number(load.rate).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <StatusPill status={load.status} />
                      </td>
                    </tr>
                  ))}
                  {loadRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-sm text-slate-500"
                      >
                        No loads with this broker yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <RiskEditor broker={typedBroker} />
      </div>
    </div>
  );
}
