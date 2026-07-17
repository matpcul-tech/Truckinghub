import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatusPill from "@/components/loads/status-pill";
import StatusControl from "@/components/loads/status-control";
import ScorePill from "@/components/loads/score-pill";
import { findBenchmark, scoreLoad } from "@/lib/scoring";
import type { LaneBenchmark, Load } from "@/lib/types";

interface LoadDetailRow extends Load {
  carriers: { company_name: string } | null;
  brokers: { name: string } | null;
  drivers: { full_name: string } | null;
  equipment: { unit_number: string | null; type: string | null } | null;
}

export default async function LoadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: load } = await supabase
    .from("loads")
    .select(
      "*, carriers(company_name), brokers(name), drivers(full_name), equipment(unit_number, type)"
    )
    .eq("id", params.id)
    .single();

  if (!load) {
    notFound();
  }

  const typedLoad = load as unknown as LoadDetailRow;

  const { data: benchmarks } = await supabase
    .from("lane_benchmarks")
    .select("*");

  const benchmark = findBenchmark(
    (benchmarks as LaneBenchmark[]) || [],
    typedLoad.origin_state,
    typedLoad.dest_state,
    typedLoad.equipment?.type || null
  );
  const score = scoreLoad(Number(typedLoad.rate_per_mile), benchmark);

  let rateconSignedUrl: string | null = null;
  if (typedLoad.ratecon_url) {
    const { data } = await supabase.storage
      .from("carrier-docs")
      .createSignedUrl(typedLoad.ratecon_url, 3600);
    rateconSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div>
      <Link href="/loads" className="text-sm text-slate-500 hover:text-slate-700">
        Back to loads
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {typedLoad.origin_state || "?"} to {typedLoad.dest_state || "?"}
        </h1>
        <StatusPill status={typedLoad.status} />
        <ScorePill score={score} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Load details
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Carrier</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.carriers?.company_name || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Broker</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.brokers?.name || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Driver</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.drivers?.full_name || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Equipment</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.equipment?.unit_number || "-"}{" "}
                {typedLoad.equipment?.type ? `(${typedLoad.equipment.type})` : ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Origin</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.origin_city || "-"}, {typedLoad.origin_state || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Destination</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.dest_city || "-"}, {typedLoad.dest_state || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Pickup date</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.pickup_date || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Delivery date</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.delivery_date || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rate</dt>
              <dd className="font-medium text-slate-900">
                ${Number(typedLoad.rate).toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Loaded miles</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.loaded_miles}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Deadhead miles</dt>
              <dd className="font-medium text-slate-900">
                {typedLoad.deadhead_miles}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Rate per mile</dt>
              <dd className="font-medium text-slate-900">
                ${Number(typedLoad.rate_per_mile).toFixed(2)}
              </dd>
            </div>
            {rateconSignedUrl && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Rate confirmation</dt>
                <dd>
                  <a
                    href={rateconSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-900 underline"
                  >
                    View document
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Advance this load through the dispatch pipeline.
          </p>
          <div className="mt-4">
            <StatusControl loadId={typedLoad.id} status={typedLoad.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
