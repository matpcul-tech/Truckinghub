import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, isOwner } from "@/lib/profile";
import InviteDispatcherForm from "@/components/team/invite-dispatcher-form";
import ReassignCarrierForm from "@/components/team/reassign-carrier-form";
import type { Carrier, Profile } from "@/lib/types";

export default async function TeamPage() {
  const profile = await getCurrentProfile();

  if (!isOwner(profile)) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Team</h1>
        <p className="mt-2 text-sm text-slate-500">
          Only the owner can view the team page.
        </p>
      </div>
    );
  }

  const supabase = createClient();
  const [{ data: profiles }, { data: carriers }] = await Promise.all([
    supabase.from("profiles").select("*").order("full_name", { ascending: true }),
    supabase
      .from("carriers")
      .select("*")
      .order("company_name", { ascending: true }),
  ]);

  const dispatchers = ((profiles as Profile[]) || []).filter(
    (p) => p.role === "dispatcher"
  );

  let emailById = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers();
    emailById = new Map(
      data.users.map((u) => [u.id, u.email || ""])
    );
  } catch {
    emailById = new Map();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Team</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {((profiles as Profile[]) || []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {p.full_name || "Unnamed"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {emailById.get(p.id) || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-slate-600">
                      {p.role}
                    </td>
                  </tr>
                ))}
                {(!profiles || profiles.length === 0) && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No team members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Carrier assignments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Reassign a carrier to a different dispatcher.
            </p>

            <div className="mt-4 space-y-3">
              {((carriers as Carrier[]) || []).map((carrier) => (
                <div
                  key={carrier.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {carrier.company_name}
                  </span>
                  <ReassignCarrierForm
                    carrier={carrier}
                    dispatchers={dispatchers}
                  />
                </div>
              ))}
              {(!carriers || carriers.length === 0) && (
                <p className="text-sm text-slate-500">No carriers yet.</p>
              )}
            </div>
          </div>
        </div>

        <InviteDispatcherForm />
      </div>
    </div>
  );
}
