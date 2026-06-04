import { sendAlertEmail } from "@/lib/alerts/send-alert-email";
import type { AlertUser, ProcessAlertsResult } from "@/lib/alerts/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Opportunity } from "@/lib/sources/types";

async function getFirstAlertUser(): Promise<AlertUser | null> {
  const supabase = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("company_profiles")
    .select("user_id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.getUserById(profile.user_id);

  if (authError || !authData.user?.email) {
    return null;
  }

  return {
    id: authData.user.id,
    email: authData.user.email,
  };
}

export async function processAlertsForOpportunities(
  opportunityIds: string[]
): Promise<ProcessAlertsResult> {
  const result: ProcessAlertsResult = { sent: 0, skipped: 0, errors: [] };

  if (opportunityIds.length === 0) {
    return result;
  }

  const user = await getFirstAlertUser();
  if (!user) {
    result.errors.push("No user with email found — skipping alerts.");
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
    const alertResult = await sendAlertEmail(user, opportunity);

    if (alertResult.sent) {
      result.sent += 1;
    } else if (alertResult.error) {
      result.errors.push(
        `${opportunity.id}: ${alertResult.error}`
      );
    } else {
      result.skipped += 1;
    }
  }

  return result;
}
