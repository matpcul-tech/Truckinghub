"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Carrier } from "@/lib/types";

function isInsuranceCurrent(expiry: string | null) {
  if (!expiry) return false;
  return new Date(expiry) > new Date();
}

export default function OnboardingChecklist({
  carrier,
  agreementSignedUrl,
  coiSignedUrl,
}: {
  carrier: Carrier;
  agreementSignedUrl: string | null;
  coiSignedUrl: string | null;
}) {
  const router = useRouter();
  const [uploadingAgreement, setUploadingAgreement] = useState(false);
  const [uploadingCoi, setUploadingCoi] = useState(false);
  const [activating, setActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requirementsMet =
    carrier.dispatch_agreement_signed &&
    carrier.authority_active &&
    isInsuranceCurrent(carrier.insurance_expiry);

  async function refresh() {
    router.refresh();
  }

  async function handleAgreementUpload(file: File) {
    setUploadingAgreement(true);
    setErrorMessage("");
    const supabase = createClient();
    const path = `${carrier.id}/agreement-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("carrier-docs")
      .upload(path, file);

    if (uploadError) {
      setErrorMessage(uploadError.message);
      setUploadingAgreement(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("carriers")
      .update({ dispatch_agreement_url: path })
      .eq("id", carrier.id);

    setUploadingAgreement(false);
    if (updateError) {
      setErrorMessage(updateError.message);
      return;
    }
    await refresh();
  }

  async function handleAgreementSignedToggle(checked: boolean) {
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("carriers")
      .update({ dispatch_agreement_signed: checked })
      .eq("id", carrier.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await refresh();
  }

  async function handleAuthorityToggle(checked: boolean) {
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("carriers")
      .update({ authority_active: checked })
      .eq("id", carrier.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await refresh();
  }

  async function handleCoiUpload(file: File) {
    setUploadingCoi(true);
    setErrorMessage("");
    const supabase = createClient();
    const path = `${carrier.id}/coi-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("carrier-docs")
      .upload(path, file);

    if (uploadError) {
      setErrorMessage(uploadError.message);
      setUploadingCoi(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("carriers")
      .update({ insurance_coi_url: path })
      .eq("id", carrier.id);

    setUploadingCoi(false);
    if (updateError) {
      setErrorMessage(updateError.message);
      return;
    }
    await refresh();
  }

  async function handleExpiryChange(value: string) {
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("carriers")
      .update({ insurance_expiry: value || null })
      .eq("id", carrier.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await refresh();
  }

  async function handleActivate() {
    setActivating(true);
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("carriers")
      .update({ status: "active" })
      .eq("id", carrier.id);

    setActivating(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Onboarding checklist
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        All three requirements must be met before this carrier can be
        activated and loads can be created for them.
      </p>

      <div className="mt-6 space-y-6">
        {/* Dispatch agreement */}
        <div className="rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">
              1. Dispatch agreement
            </span>
            <span
              className={
                carrier.dispatch_agreement_signed
                  ? "text-xs font-medium text-emerald-700"
                  : "text-xs font-medium text-amber-700"
              }
            >
              {carrier.dispatch_agreement_signed ? "Signed" : "Not signed"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              disabled={uploadingAgreement}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAgreementUpload(file);
              }}
              className="text-sm text-slate-600"
            />
            {agreementSignedUrl && (
              <a
                href={agreementSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-700 underline"
              >
                View uploaded agreement
              </a>
            )}
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={carrier.dispatch_agreement_signed}
              onChange={(e) => handleAgreementSignedToggle(e.target.checked)}
            />
            Mark agreement as signed
          </label>
        </div>

        {/* Authority */}
        <div className="rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">2. Authority</span>
            <span
              className={
                carrier.authority_active
                  ? "text-xs font-medium text-emerald-700"
                  : "text-xs font-medium text-amber-700"
              }
            >
              {carrier.authority_active ? "Active" : "Not active"}
            </span>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={carrier.authority_active}
              onChange={(e) => handleAuthorityToggle(e.target.checked)}
            />
            Authority is active (manual entry for now, FMCSA lookup comes
            later)
          </label>
        </div>

        {/* Insurance */}
        <div className="rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">3. Insurance</span>
            <span
              className={
                isInsuranceCurrent(carrier.insurance_expiry)
                  ? "text-xs font-medium text-emerald-700"
                  : "text-xs font-medium text-amber-700"
              }
            >
              {isInsuranceCurrent(carrier.insurance_expiry)
                ? "Current"
                : "Expired or missing"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="file"
              disabled={uploadingCoi}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoiUpload(file);
              }}
              className="text-sm text-slate-600"
            />
            {coiSignedUrl && (
              <a
                href={coiSignedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-700 underline"
              >
                View uploaded COI
              </a>
            )}
          </div>

          <div className="mt-3">
            <label className="block text-sm text-slate-700">
              Insurance expiry date
            </label>
            <input
              type="date"
              value={carrier.insurance_expiry || ""}
              onChange={(e) => handleExpiryChange(e.target.value)}
              className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        onClick={handleActivate}
        disabled={!requirementsMet || activating || carrier.status === "active"}
        className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {carrier.status === "active"
          ? "Carrier is active"
          : activating
            ? "Activating"
            : "Activate carrier"}
      </button>
    </div>
  );
}
