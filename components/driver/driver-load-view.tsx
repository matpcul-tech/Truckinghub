"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DriverLoad {
  id: string;
  origin_city: string | null;
  origin_state: string | null;
  dest_city: string | null;
  dest_state: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  status: string;
}

const DRIVER_STATUSES: { value: string; label: string }[] = [
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
];

export default function DriverLoadView({
  token,
  initialLoad,
}: {
  token: string;
  initialLoad: DriverLoad;
}) {
  const [load, setLoad] = useState(initialLoad);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadDone, setUploadDone] = useState(false);

  async function handleAdvance(status: string) {
    setUpdatingStatus(true);
    setStatusError("");

    const supabase = createClient();
    const { error } = await supabase.rpc("advance_load_status_by_driver_token", {
      token,
      new_status: status,
    });

    setUpdatingStatus(false);
    if (error) {
      setStatusError(error.message);
      return;
    }

    setLoad((prev) => ({ ...prev, status }));
  }

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadDone(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/driver/${token}/pod`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Upload failed");
      }

      setUploadDone(true);
      setFile(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          {load.origin_city || "?"}, {load.origin_state || "?"} to{" "}
          {load.dest_city || "?"}, {load.dest_state || "?"}
        </h1>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Pickup date</dt>
            <dd className="font-medium text-slate-900">
              {load.pickup_date || "-"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Delivery date</dt>
            <dd className="font-medium text-slate-900">
              {load.delivery_date || "-"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium capitalize text-slate-900">
              {load.status.replace("_", " ")}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <p className="text-sm font-medium text-slate-700">Update status</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DRIVER_STATUSES.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAdvance(option.value)}
                disabled={updatingStatus || load.status === option.value}
                className={`rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed ${
                  load.status === option.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {statusError && (
            <p className="mt-2 text-sm text-red-600">{statusError}</p>
          )}
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-slate-700">
            Upload proof of delivery
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            disabled={uploading}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-2 text-sm text-slate-600"
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-3 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {uploading ? "Uploading" : "Upload"}
          </button>
          {uploadDone && (
            <p className="mt-2 text-sm text-emerald-700">
              Uploaded. Thanks.
            </p>
          )}
          {uploadError && (
            <p className="mt-2 text-sm text-red-600">{uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
