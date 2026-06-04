import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmptySections } from "@/lib/proposals/sections";
import type {
  ProposalSection,
  ProposalSectionKey,
  ProposalSections,
} from "@/lib/proposals/types";

export async function upsertProposalDraft(
  supabase: SupabaseClient,
  input: {
    userId: string;
    companyId: string;
    opportunityId: string;
    savedOpportunityId: string | null;
    preGenerationAnswers: Record<string, string>;
    confirmedProjects: string[];
    confirmedTeamMembers: string[];
    sections?: ProposalSections;
  }
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("proposal_drafts")
    .upsert(
      {
        user_id: input.userId,
        company_id: input.companyId,
        opportunity_id: input.opportunityId,
        saved_opportunity_id: input.savedOpportunityId,
        pre_generation_answers: input.preGenerationAnswers,
        confirmed_projects: input.confirmedProjects,
        confirmed_team_members: input.confirmedTeamMembers,
        sections: input.sections ?? createEmptySections(),
        updated_at: now,
      },
      { onConflict: "user_id,opportunity_id" }
    )
    .select("id, sections")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProposalSection(
  supabase: SupabaseClient,
  draftId: string,
  userId: string,
  sectionKey: ProposalSectionKey,
  section: ProposalSection
) {
  const { data: draft, error: fetchError } = await supabase
    .from("proposal_drafts")
    .select("sections")
    .eq("id", draftId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !draft) {
    throw new Error(fetchError?.message ?? "Draft not found");
  }

  const sections = {
    ...(draft.sections as ProposalSections),
    [sectionKey]: section,
  };

  const { error: updateError } = await supabase
    .from("proposal_drafts")
    .update({
      sections,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return sections;
}

export async function saveAllSections(
  supabase: SupabaseClient,
  draftId: string,
  userId: string,
  sections: ProposalSections
) {
  const { error } = await supabase
    .from("proposal_drafts")
    .update({
      sections,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
