export type ProposalSectionKey =
  | "executive_summary"
  | "understanding_of_requirements"
  | "proposed_approach"
  | "past_experience"
  | "team_structure"
  | "pricing"
  | "compliance";

export type SectionStatus = "draft" | "user_fill" | "error";

export type ProposalStage = "analyzing" | "review" | "generating" | "editor";

export interface ProposalSection {
  content: string;
  status: SectionStatus;
  last_edited: string;
  error?: string;
}

export type ProposalSections = Record<ProposalSectionKey, ProposalSection>;

export interface CoveredByProfile {
  requirement: string;
  how_covered: string;
  confidence: "high" | "medium" | "low";
}

export interface NeedsUserInput {
  field: string;
  question: string;
  why_needed: string;
  required: boolean;
}

export interface CannotWrite {
  section: string;
  reason: string;
}

export interface TenderAnalysis {
  tender_summary: string;
  required_sections: string[];
  covered_by_profile: CoveredByProfile[];
  needs_user_input: NeedsUserInput[];
  cannot_write: CannotWrite[];
  projects_to_use: string[];
  team_members_to_use: string[];
}

export interface ProposalDraftRow {
  id: string;
  user_id: string;
  company_id: string;
  opportunity_id: string;
  saved_opportunity_id: string | null;
  pre_generation_answers: Record<string, string>;
  confirmed_projects: string[];
  confirmed_team_members: string[];
  sections: ProposalSections;
  status: string;
  created_at: string;
  updated_at: string;
}

export const PROPOSAL_SECTION_LABELS: Record<ProposalSectionKey, string> = {
  executive_summary: "Executive summary",
  understanding_of_requirements: "Understanding of requirements",
  proposed_approach: "Proposed approach",
  past_experience: "Past experience",
  team_structure: "Team structure",
  pricing: "Pricing",
  compliance: "Compliance",
};

export const GENERATION_SECTION_ORDER: ProposalSectionKey[] = [
  "executive_summary",
  "understanding_of_requirements",
  "proposed_approach",
  "past_experience",
  "team_structure",
  "compliance",
  "pricing",
];
