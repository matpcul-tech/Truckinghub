"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Carriers", href: "/carriers" },
  { label: "Loads", href: "/loads" },
  { label: "Brokers", href: "/brokers" },
  { label: "Trucks P&L", href: "/trucks-pnl" },
  { label: "Settings", href: "/settings/benchmarks" },
];

export default function Sidebar({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = isOwner
    ? [...NAV_ITEMS, { label: "Team", href: "/team" }]
    : NAV_ITEMS;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold text-slate-900">
          Dispatch OS
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <button
          onClick={handleSignOut}
          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
