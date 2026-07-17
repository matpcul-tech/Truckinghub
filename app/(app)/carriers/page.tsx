import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import type { Carrier, Profile } from "@/lib/types";

export default async function CarriersPage() {
  const supabase = createClient();

  const [{ data: carriers }, { data: profiles }] = await Promise.all([
    supabase
      .from("carriers")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*"),
  ]);

  const dispatcherName = (id: string | null) => {
    if (!id) return "Unassigned";
    const profile = (profiles as Profile[] | null)?.find((p) => p.id === id);
    return profile?.full_name || "Unassigned";
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Carriers</h1>
        <Link
          href="/carriers/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add carrier
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                MC number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Dispatcher
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                Fee percent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(carriers as Carrier[] | null)?.map((carrier) => (
              <tr key={carrier.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/carriers/${carrier.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {carrier.company_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {carrier.mc_number || "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <CarrierStatusBadge status={carrier.status} />
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {dispatcherName(carrier.assigned_dispatcher)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {carrier.fee_percent}%
                </td>
              </tr>
            ))}
            {(!carriers || carriers.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-500"
                >
                  No carriers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
