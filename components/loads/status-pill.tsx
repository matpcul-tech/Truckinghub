import type { LoadStatus } from "@/lib/types";

const STYLES: Record<LoadStatus, string> = {
  booked: "bg-slate-200 text-slate-700",
  dispatched: "bg-blue-100 text-blue-800",
  in_transit: "bg-amber-100 text-amber-800",
  delivered: "bg-emerald-100 text-emerald-800",
  invoiced: "bg-purple-100 text-purple-800",
  paid: "bg-teal-100 text-teal-800",
};

const LABELS: Record<LoadStatus, string> = {
  booked: "Booked",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  invoiced: "Invoiced",
  paid: "Paid",
};

export default function StatusPill({ status }: { status: LoadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
