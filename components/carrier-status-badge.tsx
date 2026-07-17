import type { CarrierStatus } from "@/lib/types";

const STYLES: Record<CarrierStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-slate-200 text-slate-700",
};

export default function CarrierStatusBadge({
  status,
}: {
  status: CarrierStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
