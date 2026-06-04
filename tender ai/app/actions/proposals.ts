"use server";

import { createClient } from "@/lib/supabase/server";
import type { PastProjectInput } from "@/lib/types";

export async function getProposalDraft(opportunityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("proposal_drafts")
    .select("*")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  return data;
}

export async function updatePastProjectForProposal(
  projectId: string,
  input: PastProjectInput
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("past_projects")
    .update({
      title: input.title,
      client_type: input.client_type,
      sector: input.sector,
      description: input.description,
      budget: input.budget,
      team_size_on_project: input.team_size_on_project,
      duration_months: input.duration_months,
      outcome: input.outcome,
      technologies_used: input.technologies_used,
    })
    .eq("id", projectId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateTeamMemberForProposal(
  memberId: string,
  input: {
    name: string;
    role: string;
    bio: string;
    years_experience: number;
    skills: string[];
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("team_members")
    .update({
      name: input.name,
      role: input.role,
      bio: input.bio,
      years_experience: input.years_experience,
      skills: input.skills,
    })
    .eq("id", memberId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
