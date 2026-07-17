import type { LaneScore } from "@/lib/scoring";

const STYLES: Record<LaneScore["label"], string> = {
  beat: "bg-emerald-100 text-emerald-800",
  within: "bg-slate-200 text-slate-700",
  below: "bg-red-100 text-red-800",
};

export default function ScorePill({ score }: { score: LaneScore | null }) {
  if (!score) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        No benchmark
      </span>
    );
  }

  const sign = score.variancePct >= 0 ? "+" : "";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[score.label]}`}
    >
      {sign}
      {score.variancePct.toFixed(0)}% vs lane
    </span>
  );
}
