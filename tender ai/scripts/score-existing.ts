import { scoreOpportunity } from "../lib/scoring/score-opportunity";
import { createAdminClient } from "../lib/supabase/admin";
import type { Opportunity } from "../lib/sources/types";
import type { CompanyProfile } from "../lib/types";

async function main() {
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("company_profiles")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to load company profile: ${profileError.message}`);
  }

  if (!profile) {
    console.error("No company profile found. Complete onboarding first.");
    process.exit(1);
  }

  const { data: opportunities, error: fetchError } = await supabase
    .from("opportunities")
    .select("*")
    .is("match_score", null);

  if (fetchError) {
    throw new Error(`Failed to fetch opportunities: ${fetchError.message}`);
  }

  const rows = (opportunities ?? []) as Opportunity[];

  if (rows.length === 0) {
    console.log("No unscored opportunities found.");
    return;
  }

  console.log(
    `Scoring ${rows.length} opportunities using profile: ${profile.name ?? profile.id}`
  );

  let scored = 0;
  const errors: string[] = [];

  for (const opportunity of rows) {
    const { score, breakdown } = scoreOpportunity(
      opportunity,
      profile as CompanyProfile
    );

    const { error: updateError } = await supabase
      .from("opportunities")
      .update({
        match_score: score,
        match_breakdown: breakdown,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunity.id);

    if (updateError) {
      errors.push(`${opportunity.id}: ${updateError.message}`);
      continue;
    }

    scored += 1;
  }

  console.log(`Done. Scored: ${scored}, Failed: ${errors.length}`);

  if (errors.length > 0) {
    for (const message of errors) {
      console.error(message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
