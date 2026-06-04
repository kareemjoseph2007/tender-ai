import type { TenderAnalysis } from "@/lib/proposals/types";
import type { Opportunity } from "@/lib/sources/types";
import type { CompanyProfile, PastProject, TeamMember } from "@/lib/types";

export function buildAnalysisUserMessage(
  opportunity: Opportunity,
  profile: CompanyProfile,
  projects: PastProject[],
  teamMembers: TeamMember[]
): string {
  return JSON.stringify(
    {
      tender_document: opportunity.raw_text ?? opportunity.plain_summary ?? opportunity.title,
      company_profile: profile,
      past_projects: projects,
      team_members: teamMembers,
    },
    null,
    2
  );
}

export function buildGenerationUserMessage(input: {
  opportunity: Opportunity;
  profile: CompanyProfile;
  projects: PastProject[];
  teamMembers: TeamMember[];
  preGenerationAnswers: Record<string, string>;
  analysis: TenderAnalysis;
  sectionInstruction: string;
  noTeamMembers?: boolean;
}): string {
  const teamNote = input.noTeamMembers
    ? "\nNote: No team members were confirmed. Use [INSERT: team member details] where specific people are required."
    : "";

  return `${input.sectionInstruction}${teamNote}

TENDER ANALYSIS:
${JSON.stringify(input.analysis, null, 2)}

ADDITIONAL ANSWERS FROM THE COMPANY:
${JSON.stringify(input.preGenerationAnswers, null, 2)}

TENDER DOCUMENT:
${input.opportunity.raw_text ?? input.opportunity.plain_summary ?? input.opportunity.title}

COMPANY PROFILE:
${JSON.stringify(input.profile, null, 2)}

CONFIRMED PAST PROJECTS:
${JSON.stringify(input.projects, null, 2)}

CONFIRMED TEAM MEMBERS:
${JSON.stringify(input.teamMembers, null, 2)}`;
}

export function matchProjectsByTitles(
  projects: PastProject[],
  titles: string[]
): PastProject[] {
  if (!titles.length) return projects.slice(0, 3);

  const matched: PastProject[] = [];
  for (const title of titles) {
    const found = projects.find(
      (p) =>
        p.title.toLowerCase() === title.toLowerCase() ||
        p.title.toLowerCase().includes(title.toLowerCase()) ||
        title.toLowerCase().includes(p.title.toLowerCase())
    );
    if (found && !matched.some((m) => m.id === found.id)) {
      matched.push(found);
    }
  }

  return matched.length > 0 ? matched : projects.slice(0, 3);
}

export function matchTeamByNames(
  members: TeamMember[],
  names: string[]
): TeamMember[] {
  if (!names.length) return members;

  const matched: TeamMember[] = [];
  for (const name of names) {
    const found = members.find(
      (m) =>
        m.name.toLowerCase() === name.toLowerCase() ||
        m.name.toLowerCase().includes(name.toLowerCase())
    );
    if (found && !matched.some((m) => m.id === found.id)) {
      matched.push(found);
    }
  }

  return matched;
}
