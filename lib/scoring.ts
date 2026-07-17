import type { LaneBenchmark } from "@/lib/types";

export interface LaneScore {
  variancePct: number;
  label: "beat" | "within" | "below";
}

export function findBenchmark(
  benchmarks: LaneBenchmark[],
  originState: string | null,
  destState: string | null,
  equipmentType: string | null
): LaneBenchmark | null {
  if (!originState || !destState || !equipmentType) return null;
  return (
    benchmarks.find(
      (b) =>
        b.origin_state === originState &&
        b.dest_state === destState &&
        b.equipment_type === equipmentType
    ) || null
  );
}

export function scoreLoad(
  ratePerMile: number,
  benchmark: LaneBenchmark | null
): LaneScore | null {
  if (!benchmark || benchmark.benchmark_rpm <= 0) return null;

  const variancePct =
    ((ratePerMile - benchmark.benchmark_rpm) / benchmark.benchmark_rpm) * 100;

  let label: LaneScore["label"] = "within";
  if (variancePct > 3) label = "beat";
  else if (variancePct < -3) label = "below";

  return { variancePct, label };
}
