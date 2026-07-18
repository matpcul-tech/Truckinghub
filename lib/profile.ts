import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (profile as Profile) || null;
}

export function isOwner(profile: Profile | null): boolean {
  return profile?.role === "owner";
}

export async function getOrCreateCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const existing = await getCurrentProfile();
  if (existing) return existing;

  // First account in the workspace becomes the owner, everyone after
  // that starts as a dispatcher until the owner assigns them carriers.
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: user.email || null,
      role: count && count > 0 ? "dispatcher" : "owner",
    })
    .select()
    .single();

  return (created as Profile) || null;
}
