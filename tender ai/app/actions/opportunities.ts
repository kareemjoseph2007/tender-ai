"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCompanyProfile } from "@/app/actions/onboarding";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function saveOpportunity(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCompanyProfile();
  if (!profile) {
    throw new Error("Company profile not found.");
  }

  const { error } = await supabase.from("saved_opportunities").upsert(
    {
      user_id: user.id,
      company_id: profile.id,
      opportunity_id: opportunityId,
      status: "spotted",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,opportunity_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
}

export async function ignoreOpportunity(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("opportunities")
    .update({
      status: "ignored",
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getTopOpportunities(limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .neq("status", "ignored")
    .order("match_score", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getOpportunityById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getSavedOpportunity(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("saved_opportunities")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  return data;
}
