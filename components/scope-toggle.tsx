"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ScopeToggle({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") === "mine" ? "mine" : "all";

  function setScope(value: "all" | "mine") {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("scope");
    } else {
      params.set("scope", "mine");
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
      <button
        onClick={() => setScope("all")}
        className={`px-3 py-1.5 text-sm font-medium ${
          scope === "all"
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        All books
      </button>
      <button
        onClick={() => setScope("mine")}
        className={`px-3 py-1.5 text-sm font-medium ${
          scope === "mine"
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        Mine
      </button>
    </div>
  );
}
