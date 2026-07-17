"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOAD_STATUSES, type LoadStatus } from "@/lib/types";

const LABELS: Record<LoadStatus, string> = {
  booked: "Booked",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  invoiced: "Invoiced",
  paid: "Paid",
};

export default function StatusControl({
  loadId,
  status,
}: {
  loadId: string;
  status: LoadStatus;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleChange(nextStatus: LoadStatus) {
    setUpdating(true);
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("loads")
      .update({ status: nextStatus })
      .eq("id", loadId);

    setUpdating(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        value={status}
        disabled={updating}
        onChange={(e) => handleChange(e.target.value as LoadStatus)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none"
      >
        {LOAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LABELS[s]}
          </option>
        ))}
      </select>
      {errorMessage && (
        <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
