import type { RiskFlag } from "@/lib/types";

const STYLES: Record<RiskFlag, string> = {
  good: "bg-emerald-100 text-emerald-800",
  watch: "bg-amber-100 text-amber-800",
  avoid: "bg-red-100 text-red-800",
  unknown: "bg-slate-200 text-slate-700",
};

export default function RiskBadge({ risk }: { risk: RiskFlag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STYLES[risk]}`}
    >
      {risk}
    </span>
  );
}
