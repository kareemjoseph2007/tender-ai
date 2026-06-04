"use server";

import { getCompanyProfile } from "@/app/actions/onboarding";
import { createClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/lib/sources/types";

export type SavedOpportunityRow = {
  id: string;
  status: string;
  opportunity_id: string;
  opportunities: Opportunity | null;
};

function normalizeSavedRow(row: Record<string, unknown>): SavedOpportunityRow {
  const joined = row.opportunities;
  const opportunity = Array.isArray(joined)
    ? (joined[0] as Opportunity | undefined) ?? null
    : (joined as Opportunity | null);

  return {
    id: row.id as string,
    status: row.status as string,
    opportunity_id: row.opportunity_id as string,
    opportunities: opportunity,
  };
}

export type DashboardData = {
  previousLastLogin: string | null;
  stats: {
    tendersThisWeek: number;
    strongMatches: number;
    deadlinesIn14Days: number;
    proposalsDrafted: number;
  };
  strongMatches: Opportunity[];
  newSinceLogin: Opportunity[];
  deadlinesComingUp: SavedOpportunityRow[];
  inProgress: SavedOpportunityRow[];
  mediumMatches: Opportunity[];
  savedOpportunityIds: string[];
  hasAnySaved: boolean;
};

function daysFromNow(iso: string): number {
  return Math.ceil(
    (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

export async function touchLastLoginAndGetPrevious(): Promise<{
  companyId: string;
  previousLastLogin: string | null;
} | null> {
  const supabase = await createClient();
  const profile = await getCompanyProfile();
  if (!profile) return null;

  const previousLastLogin =
    (profile as { last_login_at?: string | null }).last_login_at ?? null;
  const now = new Date().toISOString();

  await supabase
    .from("company_profiles")
    .update({ last_login_at: now })
    .eq("id", profile.id);

  return { companyId: profile.id, previousLastLogin };
}

export async function getDashboardData(
  companyId: string,
  userId: string,
  previousLastLogin: string | null
): Promise<DashboardData> {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    weekCountRes,
    strongCountRes,
    strongListRes,
    newListRes,
    mediumRes,
    savedRes,
    deadlinesSavedRes,
    inProgressRes,
    proposalsRes,
  ] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo)
      .neq("status", "ignored"),
    supabase
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .gte("match_score", 80)
      .neq("status", "ignored"),
    supabase
      .from("opportunities")
      .select("*")
      .gte("match_score", 80)
      .neq("status", "ignored")
      .order("match_score", { ascending: false })
      .limit(5),
    previousLastLogin
      ? supabase
          .from("opportunities")
          .select("*")
          .gt("created_at", previousLastLogin)
          .neq("status", "ignored")
          .order("match_score", { ascending: false, nullsFirst: false })
          .limit(5)
      : supabase
          .from("opportunities")
          .select("*")
          .neq("status", "ignored")
          .order("created_at", { ascending: false })
          .limit(5),
    supabase
      .from("opportunities")
      .select("*")
      .gte("match_score", 60)
      .lt("match_score", 80)
      .neq("status", "ignored")
      .order("match_score", { ascending: false })
      .limit(5),
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("user_id", userId),
    supabase
      .from("saved_opportunities")
      .select("id, status, opportunity_id, opportunities(*)")
      .eq("user_id", userId)
      .eq("company_id", companyId),
    supabase
      .from("saved_opportunities")
      .select("id, status, opportunity_id, opportunities(*)")
      .eq("user_id", userId)
      .eq("company_id", companyId)
      .in("status", ["reviewing", "writing"])
      .order("updated_at", { ascending: false }),
    supabase
      .from("proposal_drafts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("company_id", companyId),
  ]);

  const savedRows = (savedRes.data ?? []) as { opportunity_id: string }[];
  const savedOpportunityIds = savedRows.map((row) => row.opportunity_id);

  const allSavedWithOpp = (deadlinesSavedRes.data ?? []).map((row) =>
    normalizeSavedRow(row as Record<string, unknown>)
  );

  const deadlinesComingUp = allSavedWithOpp
    .filter((row) => {
      const deadline = row.opportunities?.deadline;
      if (!deadline) return false;
      const days = daysFromNow(deadline);
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => {
      const da = a.opportunities?.deadline ?? "";
      const db = b.opportunities?.deadline ?? "";
      return new Date(da).getTime() - new Date(db).getTime();
    })
    .slice(0, 10);

  const deadlinesIn14Days = allSavedWithOpp.filter((row) => {
    const deadline = row.opportunities?.deadline;
    if (!deadline) return false;
    const days = daysFromNow(deadline);
    return days >= 0 && days <= 14;
  }).length;

  const inProgress = (inProgressRes.data ?? [])
    .map((row) => normalizeSavedRow(row as Record<string, unknown>))
    .sort((a, b) => {
      const da = a.opportunities?.deadline ?? "9999-12-31";
      const db = b.opportunities?.deadline ?? "9999-12-31";
      return new Date(da).getTime() - new Date(db).getTime();
    });

  return {
    previousLastLogin,
    stats: {
      tendersThisWeek: weekCountRes.count ?? 0,
      strongMatches: strongCountRes.count ?? 0,
      deadlinesIn14Days,
      proposalsDrafted: proposalsRes.count ?? 0,
    },
    strongMatches: (strongListRes.data ?? []) as Opportunity[],
    newSinceLogin: (newListRes.data ?? []) as Opportunity[],
    deadlinesComingUp,
    inProgress,
    mediumMatches: (mediumRes.data ?? []) as Opportunity[],
    savedOpportunityIds,
    hasAnySaved: savedOpportunityIds.length > 0,
  };
}
