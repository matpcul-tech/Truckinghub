"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, isOwner } from "@/lib/profile";

export async function inviteDispatcher(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) {
    throw new Error("Only the owner can invite dispatchers");
  }

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();

  if (!email) {
    throw new Error("Email is required");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);

  if (error || !data.user) {
    throw new Error(error?.message || "Failed to invite dispatcher");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: fullName || null,
    role: "dispatcher",
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  revalidatePath("/team");
}

export async function reassignCarrier(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isOwner(profile)) {
    throw new Error("Only the owner can reassign carriers");
  }

  const carrierId = String(formData.get("carrier_id") || "");
  const dispatcherId = String(formData.get("dispatcher_id") || "");

  if (!carrierId) {
    throw new Error("Missing carrier");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("carriers")
    .update({ assigned_dispatcher: dispatcherId || null })
    .eq("id", carrierId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/team");
}
