import { createClient } from "@/lib/supabase/server";
import type { Broker } from "@/lib/types";
import AddBrokerForm from "@/components/brokers/add-broker-form";

export default async function BrokersPage() {
  const supabase = createClient();
  const { data: brokers } = await supabase
    .from("brokers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Brokers</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  MC number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Credit score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(brokers as Broker[] | null)?.map((broker) => (
                <tr key={broker.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {broker.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {broker.mc_number || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {broker.credit_score ?? "-"}
                  </td>
                </tr>
              ))}
              {(!brokers || brokers.length === 0) && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No brokers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AddBrokerForm />
      </div>
    </div>
  );
}
