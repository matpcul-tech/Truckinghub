import { reassignCarrier } from "@/app/(app)/team/actions";
import type { Carrier, Profile } from "@/lib/types";

export default function ReassignCarrierForm({
  carrier,
  dispatchers,
}: {
  carrier: Carrier;
  dispatchers: Profile[];
}) {
  return (
    <form action={reassignCarrier} className="flex items-center gap-2">
      <input type="hidden" name="carrier_id" value={carrier.id} />
      <select
        name="dispatcher_id"
        defaultValue={carrier.assigned_dispatcher || ""}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      >
        <option value="">Unassigned</option>
        {dispatchers.map((dispatcher) => (
          <option key={dispatcher.id} value={dispatcher.id}>
            {dispatcher.full_name || dispatcher.id}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Save
      </button>
    </form>
  );
}
