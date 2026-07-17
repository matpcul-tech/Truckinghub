import { createClient } from "@/lib/supabase/server";
import BenchmarksTable from "@/components/settings/benchmarks-table";
import type { LaneBenchmark } from "@/lib/types";

export default async function BenchmarksPage() {
  const supabase = createClient();
  const { data: benchmarks } = await supabase
    .from("lane_benchmarks")
    .select("*")
    .order("origin_state", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Lane benchmarks
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Manual rate per mile targets by lane and equipment type. Loads are
        scored against these on the load board.
      </p>

      <div className="mt-6">
        <BenchmarksTable benchmarks={(benchmarks as LaneBenchmark[]) || []} />
      </div>
    </div>
  );
}
