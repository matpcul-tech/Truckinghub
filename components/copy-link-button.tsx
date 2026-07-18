"use client";

import { useState } from "react";

export default function CopyLinkButton({
  path,
  label,
}: {
  path: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
