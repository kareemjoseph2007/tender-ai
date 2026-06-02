import { createAdminClient } from "@/lib/supabase/admin";
import { scoreOpportunity } from "@/lib/scoring/score-opportunity";
import type { Opportunity } from "@/lib/sources/types";
import type { CompanyProfile } from "@/lib/types";

export interface ScoringResult {
  scored: number;
  errors: string[];
}

async function getFirstCompanyProfile(): Promise<CompanyProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function scoreOpportunitiesByIds(
  opportunityIds: string[]
): Promise<ScoringResult> {
  const result: ScoringResult = { scored: 0, errors: [] };

  if (opportunityIds.length === 0) {
    return result;
  }

  try {
    const profile = await getFirstCompanyProfile();
    if (!profile) {
      result.errors.push("No company profile found — skipping scoring.");
      return result;
    }

    const supabase = createAdminClient();
    const { data: opportunities, error: fetchError } = await supabase
      .from("opportunities")
      .select("*")
      .in("id", opportunityIds);

    if (fetchError) {
      result.errors.push(`Failed to fetch opportunities: ${fetchError.message}`);
      return result;
    }

    for (const opportunity of (opportunities ?? []) as Opportunity[]) {
      const { score, breakdown } = scoreOpportunity(opportunity, profile);
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          match_score: score,
          match_breakdown: breakdown,
          updated_at: now,
        })
        .eq("id", opportunity.id);

      if (updateError) {
        result.errors.push(
          `Failed to score ${opportunity.id}: ${updateError.message}`
        );
        continue;
      }

      result.scored += 1;
    }

    return result;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : "Unknown scoring error"
    );
    return result;
  }
}
