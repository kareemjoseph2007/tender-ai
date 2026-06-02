"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingData, PastProjectInput } from "@/lib/types";

async function getOrCreateCompanyProfile(userId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("company_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing.id;
  }

  const { data: created, error } = await supabase
    .from("company_profiles")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return created.id;
}

export async function getCompanyProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data;
}

export async function getPastProjects(companyId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("past_projects")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  return data ?? [];
}

export async function saveOnboardingStep1(data: {
  name: string;
  website: string;
  country: string;
  team_size: number;
  years_in_business: number;
  languages: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const companyId = await getOrCreateCompanyProfile(user.id);

  const { error } = await supabase
    .from("company_profiles")
    .update({
      name: data.name,
      website: data.website,
      country: data.country,
      team_size: data.team_size,
      years_in_business: data.years_in_business,
      languages: data.languages,
    })
    .eq("id", companyId);

  if (error) {
    return { error: error.message };
  }

  return { success: true, companyId };
}

export async function saveOnboardingStep2(data: {
  services: string[];
  industries: string[];
  certifications: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const companyId = await getOrCreateCompanyProfile(user.id);

  const { error } = await supabase
    .from("company_profiles")
    .update({
      services: data.services,
      industries: data.industries,
      certifications: data.certifications,
    })
    .eq("id", companyId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function saveOnboardingStep3(projects: PastProjectInput[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (projects.length < 3 || projects.length > 10) {
    return { error: "Please add between 3 and 10 past projects." };
  }

  const companyId = await getOrCreateCompanyProfile(user.id);

  const { error: deleteError } = await supabase
    .from("past_projects")
    .delete()
    .eq("company_id", companyId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const rows = projects.map((project) => ({
    company_id: companyId,
    title: project.title,
    client_type: project.client_type,
    sector: project.sector,
    description: project.description,
    budget: project.budget,
    team_size_on_project: project.team_size_on_project,
    duration_months: project.duration_months,
    outcome: project.outcome,
    technologies_used: project.technologies_used,
  }));

  const { error: insertError } = await supabase
    .from("past_projects")
    .insert(rows);

  if (insertError) {
    return { error: insertError.message };
  }

  return { success: true };
}

export async function completeOnboarding(data: {
  budget_min: number;
  budget_max: number;
  countries_served: string[];
  alert_threshold: number;
}): Promise<{ error: string } | never> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const companyId = await getOrCreateCompanyProfile(user.id);

  const { error } = await supabase
    .from("company_profiles")
    .update({
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      countries_served: data.countries_served,
      alert_threshold: data.alert_threshold,
      onboarding_complete: true,
    })
    .eq("id", companyId);

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function loadOnboardingData(): Promise<Partial<OnboardingData> | null> {
  const profile = await getCompanyProfile();

  if (!profile) {
    return null;
  }

  const projects = await getPastProjects(profile.id);

  return {
    name: profile.name ?? "",
    website: profile.website ?? "",
    country: profile.country ?? "",
    team_size: profile.team_size ?? undefined,
    years_in_business: profile.years_in_business ?? undefined,
    languages: profile.languages ?? [],
    services: profile.services ?? [],
    industries: profile.industries ?? [],
    certifications: profile.certifications ?? [],
    budget_min: profile.budget_min ?? undefined,
    budget_max: profile.budget_max ?? undefined,
    countries_served: profile.countries_served ?? [],
    alert_threshold: profile.alert_threshold ?? 75,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      client_type: p.client_type,
      sector: p.sector ?? "",
      description: p.description ?? "",
      budget: p.budget ?? 0,
      team_size_on_project: p.team_size_on_project ?? 0,
      duration_months: p.duration_months ?? 0,
      outcome: p.outcome ?? "",
      technologies_used: p.technologies_used ?? [],
    })),
  };
}
