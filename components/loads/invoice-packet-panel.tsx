"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LoadStatus } from "@/lib/types";

interface ExistingInvoice {
  invoiceNumber: string | null;
  signedUrl: string | null;
  createdAt: string;
}

export default function InvoicePacketPanel({
  loadId,
  status,
  existingInvoice,
}: {
  loadId: string;
  status: LoadStatus;
  existingInvoice: ExistingInvoice | null;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{
    invoiceNumber: string;
    signedUrl: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/loads/${loadId}/invoice`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to generate invoice packet");
      }

      const data = await response.json();
      setResult({ invoiceNumber: data.invoiceNumber, signedUrl: data.signedUrl });
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to generate invoice packet"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const display = result || existingInvoice;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Invoice packet</h2>
      <p className="mt-1 text-sm text-slate-500">
        A PDF issued under the carrier identity for the carrier to send to
        the broker or their factoring company. This platform does not send
        it and does not move money.
      </p>

      {status !== "delivered" && !existingInvoice && (
        <p className="mt-3 text-sm text-slate-500">
          Available once the load is marked delivered.
        </p>
      )}

      {status === "delivered" && !existingInvoice && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-3 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {generating ? "Generating" : "Generate invoice packet"}
        </button>
      )}

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}

      {display && (
        <div className="mt-3 space-y-2">
          {display.invoiceNumber && (
            <p className="text-sm text-slate-600">
              Invoice {display.invoiceNumber}
            </p>
          )}
          {display.signedUrl && (
            <div className="flex flex-wrap gap-2">
              <a
                href={display.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Download packet
              </a>
              <button
                onClick={() => handleCopy(display.signedUrl as string)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? "Copied" : "Copy packet link"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
