import { createClient } from "@/lib/supabase/server";
import type { CompanyProfile } from "@/lib/types";

export async function requireProposalContext(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: "Company profile not found" as const };
  }

  const { data: opportunity, error: oppError } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId)
    .maybeSingle();

  if (oppError || !opportunity) {
    return { error: "Opportunity not found" as const };
  }

  const { data: projects } = await supabase
    .from("past_projects")
    .select("*")
    .eq("company_id", profile.id)
    .order("created_at", { ascending: true });

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*")
    .eq("company_id", profile.id)
    .order("created_at", { ascending: true });

  const { data: savedOpportunity } = await supabase
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  return {
    user,
    profile: profile as CompanyProfile,
    opportunity,
    projects: projects ?? [],
    teamMembers: teamMembers ?? [],
    savedOpportunityId: savedOpportunity?.id ?? null,
    supabase,
  };
}
