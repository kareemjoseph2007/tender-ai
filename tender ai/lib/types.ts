export type ClientType = "government" | "private" | "ngo";

export interface CompanyProfile {
  id: string;
  user_id: string;
  name: string | null;
  website: string | null;
  country: string | null;
  countries_served: string[];
  services: string[];
  industries: string[];
  team_size: number | null;
  certifications: string[];
  languages: string[];
  years_in_business: number | null;
  budget_min: number | null;
  budget_max: number | null;
  alert_threshold: number;
  onboarding_complete: boolean;
  created_at: string;
}

export interface PastProject {
  id: string;
  company_id: string;
  title: string;
  client_type: ClientType;
  sector: string | null;
  description: string | null;
  budget: number | null;
  team_size_on_project: number | null;
  duration_months: number | null;
  outcome: string | null;
  technologies_used: string[];
  created_at: string;
}

export interface TeamMember {
  id: string;
  company_id: string;
  name: string;
  role: string | null;
  bio: string | null;
  skills: string[];
  years_experience: number | null;
}

export interface PastProjectInput {
  id?: string;
  title: string;
  client_type: ClientType;
  sector: string;
  description: string;
  budget: number;
  team_size_on_project: number;
  duration_months: number;
  outcome: string;
  technologies_used: string[];
}

export interface OnboardingData {
  name: string;
  website: string;
  country: string;
  team_size: number;
  years_in_business: number;
  languages: string[];
  services: string[];
  industries: string[];
  certifications: string[];
  projects: PastProjectInput[];
  budget_min: number;
  budget_max: number;
  countries_served: string[];
  alert_threshold: number;
}
