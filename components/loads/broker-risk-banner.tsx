import type { Broker } from "@/lib/types";

const COPY: Record<
  Broker["risk_flag"],
  { style: string; message: string; requiresConfirm: boolean }
> = {
  good: {
    style: "border-emerald-200 bg-emerald-50 text-emerald-800",
    message: "Broker risk: good. No action needed.",
    requiresConfirm: false,
  },
  watch: {
    style: "border-amber-200 bg-amber-50 text-amber-800",
    message: "Broker risk: watch. Confirm before booking this load.",
    requiresConfirm: true,
  },
  avoid: {
    style: "border-red-200 bg-red-50 text-red-800",
    message: "Broker risk: avoid. Confirm before booking this load.",
    requiresConfirm: true,
  },
  unknown: {
    style: "border-slate-200 bg-slate-50 text-slate-700",
    message:
      "New broker, not yet screened. Verify authority and insurance before booking.",
    requiresConfirm: false,
  },
};

export function brokerRiskRequiresConfirm(risk: Broker["risk_flag"]) {
  return COPY[risk].requiresConfirm;
}

export default function BrokerRiskBanner({
  risk,
  confirmed,
  onConfirmChange,
}: {
  risk: Broker["risk_flag"];
  confirmed: boolean;
  onConfirmChange: (value: boolean) => void;
}) {
  const copy = COPY[risk];

  return (
    <div className={`rounded-md border p-3 text-sm ${copy.style}`}>
      <p>{copy.message}</p>
      {copy.requiresConfirm && (
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
          />
          I want to book with this broker anyway
        </label>
      )}
    </div>
  );
}
