export type SourcePortal = "EU_TED" | "UK_FTS";

export type EligibilityResult = "eligible" | "partial" | "not_eligible";

export interface OpportunityInsert {
  source_portal: SourcePortal;
  source_url: string | null;
  source_id: string;
  title: string | null;
  buyer_name: string | null;
  country: string | null;
  deadline: string | null;
  budget_min: number | null;
  budget_max: number | null;
  raw_text: string | null;
  plain_summary: string | null;
  requirements: string[];
  eligibility_requirements: string[];
  evaluation_criteria: string[];
  match_score: number | null;
  match_breakdown: Record<string, unknown> | null;
  eligibility_result: EligibilityResult | null;
  eligibility_notes: string | null;
  status: string;
}

export interface FetchResult {
  inserted: number;
  skipped: number;
  errors: string[];
}

export interface Opportunity extends OpportunityInsert {
  id: string;
  created_at: string;
  updated_at: string;
}
