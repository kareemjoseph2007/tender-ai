import type { ProposalSectionKey, ProposalSections } from "@/lib/proposals/types";

export function createEmptySections(): ProposalSections {
  const now = new Date().toISOString();
  const base = { content: "", last_edited: now };

  return {
    executive_summary: { ...base, status: "draft" },
    understanding_of_requirements: { ...base, status: "draft" },
    proposed_approach: { ...base, status: "draft" },
    past_experience: { ...base, status: "draft" },
    team_structure: { ...base, status: "draft" },
    pricing: {
      content:
        "[Complete your pricing here — this section cannot be generated automatically]",
      status: "user_fill",
      last_edited: now,
    },
    compliance: { ...base, status: "draft" },
  };
}

export function normalizeRequiredSections(
  sections: string[] | undefined
): ProposalSectionKey[] {
  const keys: ProposalSectionKey[] = [
    "executive_summary",
    "understanding_of_requirements",
    "proposed_approach",
    "past_experience",
    "team_structure",
    "compliance",
  ];

  if (!sections?.length) return keys;

  const normalized = new Set<ProposalSectionKey>();
  for (const name of sections) {
    const lower = name.toLowerCase();
    if (lower.includes("executive") || lower.includes("summary")) {
      normalized.add("executive_summary");
    } else if (lower.includes("understanding") || lower.includes("requirement")) {
      normalized.add("understanding_of_requirements");
    } else if (lower.includes("approach") || lower.includes("methodology")) {
      normalized.add("proposed_approach");
    } else if (lower.includes("experience") || lower.includes("track record")) {
      normalized.add("past_experience");
    } else if (lower.includes("team") || lower.includes("staff")) {
      normalized.add("team_structure");
    } else if (lower.includes("compliance") || lower.includes("declaration")) {
      normalized.add("compliance");
    } else if (lower.includes("pric") || lower.includes("commercial")) {
      normalized.add("pricing");
    }
  }

  return normalized.size > 0 ? Array.from(normalized) : keys;
}
