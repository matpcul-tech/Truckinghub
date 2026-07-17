import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CarrierStatusBadge from "@/components/carrier-status-badge";
import OnboardingChecklist from "@/components/carriers/onboarding-checklist";
import EquipmentList from "@/components/carriers/equipment-list";
import DriversList from "@/components/carriers/drivers-list";
import type { Carrier, Equipment, Driver } from "@/lib/types";

export default async function CarrierDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: carrier } = await supabase
    .from("carriers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!carrier) {
    notFound();
  }

  const [{ data: equipment }, { data: drivers }] = await Promise.all([
    supabase
      .from("equipment")
      .select("*")
      .eq("carrier_id", params.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("drivers")
      .select("*")
      .eq("carrier_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const typedCarrier = carrier as Carrier;

  let agreementSignedUrl: string | null = null;
  if (typedCarrier.dispatch_agreement_url) {
    const { data } = await supabase.storage
      .from("carrier-docs")
      .createSignedUrl(typedCarrier.dispatch_agreement_url, 3600);
    agreementSignedUrl = data?.signedUrl ?? null;
  }

  let coiSignedUrl: string | null = null;
  if (typedCarrier.insurance_coi_url) {
    const { data } = await supabase.storage
      .from("carrier-docs")
      .createSignedUrl(typedCarrier.insurance_coi_url, 3600);
    coiSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <div>
      <Link
        href="/carriers"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        Back to carriers
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          {typedCarrier.company_name}
        </h1>
        <CarrierStatusBadge status={typedCarrier.status} />
      </div>

      <div className="mt-1 text-sm text-slate-500">
        {typedCarrier.mc_number && <span>MC {typedCarrier.mc_number}</span>}
        {typedCarrier.mc_number && typedCarrier.dot_number && (
          <span> - </span>
        )}
        {typedCarrier.dot_number && <span>DOT {typedCarrier.dot_number}</span>}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OnboardingChecklist
          carrier={typedCarrier}
          agreementSignedUrl={agreementSignedUrl}
          coiSignedUrl={coiSignedUrl}
        />

        <div className="space-y-6">
          <EquipmentList
            carrierId={typedCarrier.id}
            equipment={(equipment as Equipment[]) || []}
          />
          <DriversList
            carrierId={typedCarrier.id}
            drivers={(drivers as Driver[]) || []}
          />
        </div>
      </div>
    </div>
  );
}
